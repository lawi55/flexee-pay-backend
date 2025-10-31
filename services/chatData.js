// services/chatData.js
const { Op } = require("sequelize");
const Utilisateur = require("../models/Utilisateur");
const Compte = require("../models/Compte");
const Transaction = require("../models/Transaction");
const Paiement = require("../models/Paiement");
const Categories = require("../models/Categorie");
const Objectif = require("../models/Objectif");
const ParentJeune = require("../models/ParentJeune");
const Tirelire = require("../models/Tirelire");

// ---- tiny formatters ----
const fmtMoney = (n) => Number(n ?? 0).toFixed(3).replace(".", ",") + " DT";
const fmtDate = (d) => new Date(d).toISOString().slice(0,10);

// Join helpers (define once at app boot, shown here for clarity)
Paiement.belongsTo(Categories, { foreignKey: "id_categorie", as: "categorie" });

// ---- data access ----
async function getCompteAndPiggy(userId) {
  const compte = await Compte.findOne({ where: { userId } }); // comptes.userId -> compte.id
  const tirelire = await Tirelire.findOne({ where: { userId } }); // tirelires.userId
  return { compte, tirelire };
}

async function getChildIdsForParent(parentId) {
  const rows = await ParentJeune.findAll({ where: { id_parent: parentId } });
  return rows.map(r => r.id_jeune);
}

async function getActiveObjectives(tirelireId) {
  if (!tirelireId) return [];
  return await Objectif.findAll({
    where: { id_tirelire: tirelireId, statut: "En cours" },
    order: [["date_fin", "ASC"]],
    limit: 5
  });
}

async function getLast10TxWithCategories(compteId) {
  if (!compteId) return [];
  const tx = await Transaction.findAll({
    where: { compteId },
    order: [["date_transaction", "DESC"]],
    limit: 10
  });

  // fetch categories only for "Paiement" via paiements table (id_compteJeune === compteId)
  const paiementRows = await Paiement.findAll({
    where: { id_compteJeune: compteId, createdAt: { [Op.gte]: tx.at(-1)?.date_transaction ?? new Date(0) } },
    include: [{ model: Categories, as: "categorie", required: false }],
    order: [["createdAt","DESC"]],
    limit: 50
  });

  // index by createdAt closest (simple heuristic)
  const byIso = new Map(paiementRows.map(p => [new Date(p.createdAt).toISOString(), p]));
  return tx.map(t => {
    let cat = null;
    if (t.type_transaction === "Paiement") {
      // try exact timestamp match first
      const key = new Date(t.date_transaction).toISOString();
      const p = byIso.get(key) || paiementRows.find(p => p.id_compteJeune === compteId && Math.abs(new Date(p.createdAt) - new Date(t.date_transaction)) < 60_000);
      cat = p?.categorie?.nom_categorie || null;
    }
    return {
      id: t.id,
      date: fmtDate(t.date_transaction),
      type: t.type_transaction,
      montant: fmtMoney(t.montant),
      solde_apres: fmtMoney(t.solde_apres),
      category: cat // may be null for non-paiement types
    };
  });
}

function compactTxBlock(list) {
  // ASC for readability
  const asc = [...list].reverse();
  return asc.map(t =>
    `${t.date} | ${t.type}${t.category ? ` (${t.category})` : ""} | ${t.montant} | solde_apres: ${t.solde_apres}`
  ).join("\n");
}

function compactObjectives(objs) {
  return objs.map(o =>
    `objectif: ${fmtMoney(o.montant)} | progress: ${fmtMoney(o.progress)} | fin: ${fmtDate(o.date_fin)}`
  ).join("\n");
}

// ---- role payloads ----
async function buildParentPayload(parentId) {
  const childIds = await getChildIdsForParent(parentId);
  const perChild = [];
  for (const childId of childIds) {
    const { compte, tirelire } = await getCompteAndPiggy(childId);
    const soldeCompte = fmtMoney(compte?.solde ?? 0);
    const soldeTirelire = fmtMoney(tirelire?.solde ?? 0);
    const objectifs = await getActiveObjectives(tirelire?.id);
    const tx = await getLast10TxWithCategories(compte?.id);
    perChild.push({
      childId,
      soldeCompte,
      soldeTirelire,
      objectifsBlock: objectifs.length ? compactObjectives(objectifs) : "Aucun objectif en cours",
      transactionsBlock: tx.length ? compactTxBlock(tx) : "Aucune transaction récente"
    });
  }
  return perChild;
}

async function buildChildPayload(childId) {
  const { compte, tirelire } = await getCompteAndPiggy(childId);
  const objectifs = await getActiveObjectives(tirelire?.id);
  const tx = await getLast10TxWithCategories(compte?.id);
  return {
    soldeCompte: fmtMoney(compte?.solde ?? 0),
    soldeTirelire: fmtMoney(tirelire?.solde ?? 0),
    objectifsBlock: objectifs.length ? compactObjectives(objectifs) : "Aucun objectif en cours",
    transactionsBlock: tx.length ? compactTxBlock(tx) : "Aucune transaction récente",
  };
}

module.exports = {
  buildParentPayload,
  buildChildPayload,
};
