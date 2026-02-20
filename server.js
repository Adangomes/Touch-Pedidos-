const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// 🔐 TOKEN (DEPOIS COLOCA EM VARIÁVEL DE AMBIENTE)
const TOKEN = "APP_USR-1998879028639759-021913-02c51f11e5b00f26dc6a0577a867ef53-273401276";

// 🧠 "Banco" em memória
let pagamentos = {};

// ==============================
// 🧾 CRIAR PAGAMENTO PIX
// ==============================
app.post("/criar-pix", async (req, res) => {
    const { total, nome } = req.body;

    console.log(`📦 Pedido recebido: R$ ${total} - ${nome}`);

    try {
        const response = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: Number(total),
                description: "Pedido Totem",
                payment_method_id: "pix",
                payer: {
                    email: `totem_${Math.floor(Math.random() * 999999)}@gmail.com`,
                    first_name: nome || "Cliente"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "X-Idempotency-Key": Date.now().toString()
                }
            }
        );

        const data = response.data;
        const paymentId = data.id;

        // salva como NÃO pago
        pagamentos[paymentId] = false;

        const qr = data.point_of_interaction.transaction_data.qr_code_base64;

        console.log("✅ PIX gerado:", paymentId);

        res.json({
            qr: `data:image/png;base64,${qr}`,
            id: paymentId
        });

    } catch (err) {
        console.error("❌ ERRO MP:", err.response?.data || err.message);

        res.status(500).json({
            erro: "Erro ao gerar Pix"
        });
    }
});

// ==============================
// 🔎 VERIFICAR PAGAMENTO (RÁPIDO)
// ==============================
app.get("/verificar-pagamento", (req, res) => {
    const id = req.query.id;

    res.json({
        pago: pagamentos[id] || false
    });
});

// ==============================
// 🔔 WEBHOOK (CONFIRMAÇÃO REAL)
// ==============================
app.post("/webhook", async (req, res) => {

    console.log("🔔 Webhook recebido:", req.body);

    try {
        const paymentId = req.body?.data?.id;

        if (!paymentId) return res.sendStatus(200);

        const pagamento = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        const status = pagamento.data.status;

        console.log("📊 Status pagamento:", status);

        if (status === "approved") {
            console.log("💰 PAGAMENTO APROVADO!");

            pagamentos[paymentId] = true;
        }

        res.sendStatus(200);

    } catch (err) {
        console.error("❌ Erro webhook:", err.message);
        res.sendStatus(500);
    }
});

// ==============================
// ❤️ TESTE
// ==============================
app.get("/", (req, res) => {
    res.send("🚀 Servidor rodando!");
});

// ==============================
// 🚀 START
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🔥 Server ON na porta", PORT);
});
