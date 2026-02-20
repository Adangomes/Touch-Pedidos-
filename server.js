const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// 🔐 TOKEN via variável de ambiente (NUNCA deixar no código)
const TOKEN = "APP_USR-1998879028639759-021913-02c51f11e5b00f26dc6a0577a867ef53-273401276";

// ==============================
// 🧾 CRIAR PAGAMENTO PIX
// ==============================
app.post("/criar-pix", async (req, res) => {
    const { total, nome, pedido } = req.body;

    try {
        const response = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: Number(total),
                description: "Pedido Totem",
                payment_method_id: "pix",
                payer: {
                    email: "totem@email.com",
                    first_name: nome || "Cliente"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        const data = response.data;

        const qr = data.point_of_interaction.transaction_data.qr_code_base64;

        res.json({
            qr: `data:image/png;base64,${qr}`,
            pagamento_id: data.id
        });

    } catch (err) {
        console.log(err.response?.data || err.message);
        res.status(500).json({ erro: "Erro ao gerar Pix" });
    }
});

// ==============================
// 🔔 WEBHOOK (CONFIRMA PAGAMENTO)
// ==============================
app.post("/webhook", async (req, res) => {

    console.log("🔔 Webhook recebido:", req.body);

    try {
        const paymentId = req.body?.data?.id;

        if (!paymentId) return res.sendStatus(200);

        // 🔎 CONSULTA PAGAMENTO REAL
        const pagamento = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        const status = pagamento.data.status;

        if (status === "approved") {
            console.log("✅ PAGAMENTO APROVADO!");

            // 👉 AQUI você pode:
            // salvar pedido
            // imprimir
            // enviar pra cozinha

        } else {
            console.log("⏳ Status:", status);
        }

        res.sendStatus(200);

    } catch (err) {
        console.log("Erro webhook:", err.message);
        res.sendStatus(500);
    }
});

// ==============================
// ❤️ ROTA PRA TESTE (IMPORTANTE NO RENDER)
// ==============================
app.get("/", (req, res) => {
    res.send("Servidor rodando!");
});

// ==============================
// 🚀 START SERVIDOR (CORRETO)
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta", PORT);
});
