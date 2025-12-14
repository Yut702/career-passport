/**
 * 企業管理APIルート
 *
 * 企業のウォレットアドレスと企業名を紐づけるAPIを提供します。
 */
import express from "express";
import {
  createOrUpdateCompany,
  getCompanyByWalletAddress,
  getAllCompanies,
  updateCompanyStatus,
  deleteCompany,
} from "../lib/dynamo-companies.js";

const router = express.Router();

/**
 * GET /api/companies
 * すべての企業を取得
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const companies = await getAllCompanies(status || null);
    res.json({ companies });
  } catch (error) {
    console.error("Error getting companies:", error);
    res.status(500).json({ error: "Failed to get companies" });
  }
});

/**
 * GET /api/companies/:walletAddress
 * ウォレットアドレスで企業を取得
 */
router.get("/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const company = await getCompanyByWalletAddress(walletAddress);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ company });
  } catch (error) {
    console.error("Error getting company:", error);
    res.status(500).json({ error: "Failed to get company" });
  }
});

/**
 * POST /api/companies
 * 企業を登録または更新
 */
router.post("/", async (req, res) => {
  try {
    const { walletAddress, companyName, status } = req.body;

    if (!walletAddress || !companyName) {
      return res
        .status(400)
        .json({ error: "walletAddress and companyName are required" });
    }

    const company = await createOrUpdateCompany({
      walletAddress,
      companyName,
      status,
    });

    res.json({ company });
  } catch (error) {
    console.error("Error creating/updating company:", error);
    res.status(500).json({ error: "Failed to create/update company" });
  }
});

/**
 * PUT /api/companies/:walletAddress/status
 * 企業のステータスを更新
 */
router.put("/:walletAddress/status", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const company = await updateCompanyStatus(walletAddress, status);
    res.json({ company });
  } catch (error) {
    console.error("Error updating company status:", error);
    res.status(500).json({ error: "Failed to update company status" });
  }
});

/**
 * DELETE /api/companies/:walletAddress
 * 企業を削除（論理削除）
 */
router.delete("/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const company = await deleteCompany(walletAddress);
    res.json({ company });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

export default router;

