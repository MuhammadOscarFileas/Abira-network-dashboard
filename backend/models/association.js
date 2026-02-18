import UserModel from "./users_model.js";
import PembayaranModel from "./pembayaran_model.js";
import TagihanModel from "./tagihan_model.js";
import BtsModel from "./bts_model.js";
import LogsModel from "./logs_model.js";
import PelangganModel from "./pelanggan_model.js";
import PaketModel from "./paket_model.js";

// Association between Paket and Pelanggan (1 to many)
PaketModel.hasMany(PelangganModel, { foreignKey: "id_paket" });
PelangganModel.belongsTo(PaketModel, { foreignKey: "id_paket", as: "paket" });

// Association between Users and Logs
UserModel.hasMany(LogsModel, { foreignKey: "id_user" });
LogsModel.belongsTo(UserModel, { foreignKey: "id_user" });

// Association between Bts and Pelanggan
BtsModel.hasMany(PelangganModel, { foreignKey: "id_bts" });
PelangganModel.belongsTo(BtsModel, { foreignKey: "id_bts", as: "bts" });

// Association between Pelanggan and Tagihan
PelangganModel.hasMany(TagihanModel, { foreignKey: "id_pelanggan" });
TagihanModel.belongsTo(PelangganModel, { foreignKey: "id_pelanggan" });

// Association 1 to 1 between Tagihan and Pembayaran
TagihanModel.hasOne(PembayaranModel, { foreignKey: "id_tagihan" });
PembayaranModel.belongsTo(TagihanModel, { foreignKey: "id_tagihan" });

// Association between Users and Pembayaran
UserModel.hasMany(PembayaranModel, { foreignKey: "id_user" });
PembayaranModel.belongsTo(UserModel, { foreignKey: "id_user" });



