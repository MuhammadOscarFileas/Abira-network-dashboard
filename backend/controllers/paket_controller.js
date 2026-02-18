import PaketModel from "../models/paket_model.js";

export const addPaket = async (req, res) => {
  const { nama_paket, harga } = req.body;
  try {
    const newPaket = await PaketModel.create({ nama_paket, harga });
    res.status(201).json({ message: "Paket created successfully", paket: newPaket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllPaket = async (req, res) => {
  try {
    const list = await PaketModel.findAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPaketById = async (req, res) => {
  const { id_paket } = req.params;
  try {
    const paket = await PaketModel.findByPk(id_paket);
    if (!paket) return res.status(404).json({ message: "Paket not found" });
    res.json(paket);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePaket = async (req, res) => {
  const { id_paket } = req.params;
  const { nama_paket, harga } = req.body;
  try {
    const paket = await PaketModel.findByPk(id_paket);
    if (!paket) return res.status(404).json({ message: "Paket not found" });
    await PaketModel.update({ nama_paket, harga }, { where: { id_paket } });
    res.json({ message: "Paket updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deletePaket = async (req, res) => {
  const { id_paket } = req.params;
  try {
    const deleted = await PaketModel.destroy({ where: { id_paket } });
    if (!deleted) return res.status(404).json({ message: "Paket not found" });
    res.json({ message: "Paket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
