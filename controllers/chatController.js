// controllers/chatController.js
const axios = require("axios"); // ✅ Add this line

const ChatHistory = require("../models/chatHistory");
const Utilisateur = require("../models/Utilisateur");
const Compte = require("../models/Compte");
const Tirelire = require("../models/Tirelire");
const ParentJeune = require("../models/ParentJeune");
const Transaction = require("../models/Transaction");
const Paiement = require("../models/Paiement");
const Magasin = require("../models/Magasin");


const SYSTEM_PROMPT = (
  role,
  context = "",
  roleBlock = ""
) => `Tu es Flexoo, l’assistant virtuel de Flexee Pay.
Réponds toujours dans la langue utilisée par l’utilisateur.
Réponses courtes et claires (1–2 phrases).
Reste utile et propose des conseils financiers adaptés.
Propose des idées d’économies et de gestion de budget selon les catégories de depenses des etudiants (vous pouvez depasser 2 lignes si necessaire).
Ne divulgue jamais d’informations personnelles.
Ne donne jamais de conseils médicaux, juridiques ou autres conseils professionnels.
Si tu ne connais pas la réponse, dis-le simplement.

Rôle utilisateur: ${role}
${roleBlock ? `\nDonnées ${role}:\n${roleBlock}\n` : ""}
Contexte: ${context}`;

async function callHF(prompt) {
  const API_URL = "https://router.huggingface.co/v1/chat/completions";
  const modelId =
    process.env.HF_MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct:fireworks-ai";
  const token = process.env.HF_TOKEN;

  if (!token) throw new Error("HF_TOKEN missing in environment");

  const { data } = await axios.post(
    API_URL,
    {
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 512,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120000,
    }
  );

  // 🧹 Clean and return the final text
  let text = data?.choices?.[0]?.message?.content || "";
  text = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "")
    .replace(/^(User|Assistant|System):/gi, "")
    .trim();

  return text || "(empty reply)";
}

// ↓ paste this directly under your existing callHF, keep your imports & SYSTEM_PROMPT as-is
exports.aiChat = async (req, res) => {
  try {
    const { message, context, role = "inconnu" } = req.body || {};
    const userId = req.user.id;

    if (!message || !String(message).trim()) {
      return res
        .status(400)
        .json({ message: "Message requis", success: false });
    }
    if (!context || !String(context).trim()) {
      return res
        .status(400)
        .json({ message: "Contexte requis", success: false });
    }

    // ── inline minis (scoped here for clarity; no external helpers) ──────────────
    const fmtMoney = (v) => `${Number(v ?? 0).toFixed(2)} DT`;
    const lc = (s = "") => String(s || "").toLowerCase();

    const extractIntent = (raw = "") => {
      const m = lc(raw);
      if (/\b(dernier|last)\s+(paiement|payment)\b/.test(m))
        return { type: "LAST_PAYMENT" };
      if (/\b(mon|ma|my)\s+(solde|balance)\b/.test(m))
        return { type: "MY_SOLDE" };
      const name =
        m.match(
          /\b(?:tirelire|piggy)\b.*\b(?:de|d')\s*([a-zàâçéèêëîïôûùüÿñæœ'-]+)\b/i
        )?.[1] ||
        m.match(/\b(?:enfant|child)\s+([a-zàâçéèêëîïôûùüÿñæœ'-]+)\b/i)?.[1] ||
        m.match(/\balex\b/i)?.[0];
      if (/\b(tirelire|piggy)\b/.test(m) && name)
        return { type: "CHILD_TIRELIRE", childName: name };
      return { type: "OTHER" };
    };

    const getCompte = (uid) => Compte.findOne({ where: { userId: uid } });
    const getTirelire = (uid) => Tirelire.findOne({ where: { userId: uid } });

    // Récupère les paiements (Transaction → Paiement + Magasin)
    const getLastPaiements = async (compteId, n = 5) => {
      if (!compteId) return [];
      const txs = await Transaction.findAll({
        where: { compteId, type_transaction: "Paiement" },
        order: [["date_transaction", "DESC"]],
        limit: n,
      });
      if (!txs.length) return [];

      const ids = txs.map((t) => t.id);
      const paiements = await Paiement.findAll({ where: { id: ids } });
      const pById = new Map(paiements.map((p) => [p.id, p]));

      const magasinIds = [
        ...new Set(paiements.map((p) => p.id_magasin).filter(Boolean)),
      ];
      const magasins = magasinIds.length
        ? await Magasin.findAll({ where: { id: magasinIds } })
        : [];
      const mById = new Map(magasins.map((m) => [m.id, m]));

      return txs.map((t) => {
        const p = pById.get(t.id);
        const store = p ? mById.get(p.id_magasin) : null;
        return {
          id: t.id,
          montant: t.montant,
          date: t.date_transaction,
          statut: t.statut,
          magasin: store?.nomMagasin || null,
        };
      });
    };

    const buildChildPayload = async (childUserId) => {
      const [c, tire, last5] = await Promise.all([
        getCompte(childUserId),
        getTirelire(childUserId),
        (async () => {
          const cc = await getCompte(childUserId);
          return cc ? getLastPaiements(cc.id, 5) : [];
        })(),
      ]);
      const soldeCompte = c?.solde ?? 0;
      const soldeTirelire = tire?.solde ?? 0;
      const transactionsBlock =
        (last5 || [])
          .map(
            (p, i) =>
              `${i + 1}. ${fmtMoney(p.montant)} • ${
                p.magasin || "N/A"
              } • ${new Date(p.date)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")}`
          )
          .join("\n") || "Aucun paiement.";
      return { soldeCompte, soldeTirelire, last5, transactionsBlock };
    };

    const buildParentPayload = async (parentUserId) => {
      const links = await ParentJeune.findAll({
        where: { id_parent: parentUserId },
      });
      const childIds = links.map((l) => l.id_jeune);
      const kids = childIds.length
        ? await Utilisateur.findAll({ where: { id: childIds } })
        : [];
      const out = [];
      for (const k of kids) {
        const data = await buildChildPayload(k.id);
        out.push({
          childId: k.id,
          childNom:
            [k.prenom, k.nom].filter(Boolean).join(" ").trim() || "(Sans nom)",
          ...data,
        });
      }
      return out;
    };

    // ── 1) Réponses directes sans LLM ───────────────────────────────────────────
    const intent = extractIntent(message);

    if (["Jeune"].includes(lc(role))) {
      if (intent.type === "MY_SOLDE") {
        const [c, t] = await Promise.all([
          getCompte(userId),
          getTirelire(userId),
        ]);
        const quick = `Ton solde est ${fmtMoney(
          c?.solde
        )} (compte) et ${fmtMoney(t?.solde)} (tirelire).`;
        try {
          await ChatHistory.create({
            userId,
            userMessage: message,
            aiResponse: quick,
            context,
          });
        } catch {}
        return res
          .status(200)
          .json({
            response: quick,
            success: true,
            roleIncluded: true,
            source: "direct",
          });
      }
      if (intent.type === "LAST_PAYMENT") {
        const c = await getCompte(userId);
        const last = c ? (await getLastPaiements(c.id, 1))[0] : null;
        const quick = last
          ? `Dernier paiement: ${fmtMoney(last.montant)}${
              last.magasin ? ` chez ${last.magasin}` : ""
            } le ${new Date(last.date).toLocaleString()}.`
          : "Aucun paiement trouvé.";
        try {
          await ChatHistory.create({
            userId,
            userMessage: message,
            aiResponse: quick,
            context,
          });
        } catch {}
        return res
          .status(200)
          .json({
            response: quick,
            success: true,
            roleIncluded: true,
            source: "direct",
          });
      }
    }

    if (lc(role) === "Parent") {
      if (intent.type === "MY_SOLDE") {
        const [c, t] = await Promise.all([
          getCompte(userId),
          getTirelire(userId),
        ]);
        const quick = `Votre solde est ${fmtMoney(
          c?.solde
        )} (compte) et ${fmtMoney(t?.solde)} (tirelire).`;
        try {
          await ChatHistory.create({
            userId,
            userMessage: message,
            aiResponse: quick,
            context,
          });
        } catch {}
        return res
          .status(200)
          .json({
            response: quick,
            success: true,
            roleIncluded: true,
            source: "direct",
          });
      }
      if (intent.type === "CHILD_TIRELIRE") {
        const perChild = await buildParentPayload(userId);
        const name = lc(intent.childName || "");
        const found = perChild.find((c) => lc(c.childNom).includes(name));
        const quick = found
          ? `La tirelire de ${found.childNom} est à ${fmtMoney(
              found.soldeTirelire
            )}.`
          : `Je n'ai pas trouvé l'enfant « ${intent.childName || "?"} ».`;
        try {
          await ChatHistory.create({
            userId,
            userMessage: message,
            aiResponse: quick,
            context,
          });
        } catch {}
        return res
          .status(200)
          .json({
            response: quick,
            success: true,
            roleIncluded: true,
            source: "direct",
          });
      }
      if (intent.type === "LAST_PAYMENT") {
        const perChild = await buildParentPayload(userId);
        const all = perChild
          .flatMap((c) =>
            (c.last5 || []).map((p) => ({ child: c.childNom, ...p }))
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const lp = all[0];
        const quick = lp
          ? `Dernier paiement (tous enfants): ${fmtMoney(lp.montant)} par ${
              lp.child
            }${lp.magasin ? ` chez ${lp.magasin}` : ""} le ${new Date(
              lp.date
            ).toLocaleString()}.`
          : "Aucun paiement enfant trouvé.";
        try {
          await ChatHistory.create({
            userId,
            userMessage: message,
            aiResponse: quick,
            context,
          });
        } catch {}
        return res
          .status(200)
          .json({
            response: quick,
            success: true,
            roleIncluded: true,
            source: "direct",
          });
      }
    }

    // ── 2) Construire le roleBlock (réutilise votre format commenté) ────────────
    let roleBlock = "";
    if (lc(role) === "Parent") {
      const perChild = await buildParentPayload(userId);
      roleBlock = perChild
        .map((c, i) => {
          return `Enfant ${i + 1}: ${c.childNom} (id:${c.childId})
- Solde compte: ${fmtMoney(c.soldeCompte)}
- Solde tirelire: ${fmtMoney(c.soldeTirelire)}
- 5 derniers paiements:
${c.transactionsBlock}`;
        })
        .join("\n\n");
    } else if (["Jeune"].includes(lc(role))) {
      const data = await buildChildPayload(userId);
      roleBlock = `Solde compte: ${fmtMoney(data.soldeCompte)}
Solde tirelire: ${fmtMoney(data.soldeTirelire)}
5 derniers paiements:
${data.transactionsBlock}`;
    }

    // ── 3) Historique (5 derniers) ──────────────────────────────────────────────
    let historyText = "";
    try {
      const rows = await ChatHistory.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: 5,
      });
      historyText = rows
        .reverse()
        .map((r) => `User: ${r.userMessage}\nAssistant: ${r.aiResponse}`)
        .join("\n\n");
    } catch (e) {
      console.error("Erreur historique:", e.message);
    }

    // ── 4) Appel LLM avec votre SYSTEM_PROMPT existant ──────────────────────────
    const system = SYSTEM_PROMPT(role, context, roleBlock);
    const completePrompt = `${system}

${
  historyText ? `Conversation précédente :\n${historyText}\n\n` : ""
}Conversation actuelle :
User: ${message}
Assistant:`;

    const aiResponse =
      (await callHF(completePrompt)) ||
      "Je n'ai pas pu générer de réponse. Veuillez réessayer.";

    try {
      await ChatHistory.create({
        userId,
        userMessage: message,
        aiResponse,
        context,
      });
    } catch (e) {
      console.error("Erreur enregistrement:", e.message);
    }

    return res.status(200).json({
      response: aiResponse,
      success: true,
      roleIncluded: Boolean(roleBlock),
      source: "llm",
    });
  } catch (error) {
    console.error("Erreur /ai-chat:", error);
    return res.status(500).json({ message: "Erreur serveur", success: false });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ uniquement depuis le JWT

    const exists = await Utilisateur.findByPk(userId);
    if (!exists) {
      return res
        .status(404)
        .json({ message: "Utilisateur introuvable", success: false });
    }

    const history = await ChatHistory.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 15,
    });

    return res.status(200).json({ history, success: true });
  } catch (error) {
    console.error("Erreur /ai-chat/history:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération de l'historique",
      success: false,
    });
  }
};
