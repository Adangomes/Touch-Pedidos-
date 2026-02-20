const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const TOKEN = "SEU_TOKEN_AQUI";

// CRIAR PIX
app.post("/criar-pix", async (req, res) => {
    const { total, nome, numeroPedido } = req.body;

    try {
        const pagamento = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: total,
                description: `Pedido ${numeroPedido}`,
                payment_method_id: "pix",
                payer: {
                    email: "totem@email.com",
                    first_name: nome
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        const qr = pagamento.data.point_of_interaction.transaction_data.qr_code_base64;

        res.json({
            qr: `data:image/png;base64,${qr}`
        });

    } catch (err) {
        res.status(500).json({ erro: "Erro ao gerar pix" });
    }
});

// WEBHOOK (CONFIRMA PAGAMENTO)
app.post("/webhook", (req, res) => {
    console.log("Pagamento aprovado:", req.body);

    // AQUI você:
    // salvar pedido
    // mandar imprimir

    res.sendStatus(200);
});

app.listen(3000, () => console.log("Servidor rodando"));
