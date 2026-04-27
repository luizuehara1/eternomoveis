import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mercado Pago Integration
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
  });

  app.post("/api/create_preference", async (req, res) => {
    try {
      const { items, customerName, customerPhone, customerEmail } = req.body;

      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!accessToken) {
        console.error("MERCADO_PAGO_ACCESS_TOKEN is missing in environment variables");
        return res.status(500).json({ 
          error: "Configuração incompleta: MERCADO_PAGO_ACCESS_TOKEN não encontrado. Por favor, adicione seu token no menu Settings > Secrets." 
        });
      }

      // Re-initialize client with latest token
      const currentClient = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(currentClient);
      
      const baseUrl = process.env.APP_URL || "https://ais-dev-z4ksmzhxqewrns5y7g47q6-158810650718.us-east5.run.app";

      // Melhora o tratamento do telefone
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const areaCode = cleanPhone.length >= 10 ? cleanPhone.substring(0, 2) : "11";
      const phoneNumber = cleanPhone.length >= 11 ? cleanPhone.substring(2) : (cleanPhone.length >= 10 ? cleanPhone.substring(2) : cleanPhone);

      const response = await preference.create({
        body: {
          items: items.map((item: any) => ({
            id: String(item.id),
            title: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price),
            currency_id: "BRL",
          })),
          payer: {
            name: customerName,
            email: customerEmail,
            phone: {
              area_code: areaCode,
              number: phoneNumber,
            }
          },
          payment_methods: {
            excluded_payment_types: [
              { id: "ticket" } // Exclui boleto para focar em Pix e Cartão
            ],
            installments: 12,
          },
          back_urls: {
            success: `${baseUrl}/?status=success`,
            failure: `${baseUrl}/?status=failure`,
            pending: `${baseUrl}/?status=pending`,
          },
          auto_return: "approved",
          statement_descriptor: "LOJA VIRTUAL",
        }
      });

      res.json({ id: response.id, init_point: response.init_point });
    } catch (error: any) {
      console.error("Mercado Pago API Detailed Error:", error);
      // Se for um erro da API do Mercado Pago, ele costuma vir em um formato específico
      const errorMessage = error.cause?.[0]?.description || error.message || "Erro na API do Mercado Pago";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Webhook endpoint (mocking for now, as we don't have a public URL for local dev)
  app.post("/api/webhooks/mercadopago", (req, res) => {
    console.log("Mercado Pago Webhook:", req.body);
    res.sendStatus(200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
