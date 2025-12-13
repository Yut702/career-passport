/**
 * 既存のVCファイルをW3C標準形式に変換するスクリプト
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vcsDir = path.join(__dirname, "../src/data/sample-vcs");

// VCタイプマッピング
const typeMap = {
  myNumber: "MyNumberCredential",
  toeic: "TOEICCredential",
  degree: "DegreeCredential",
  certification: "CertificationCredential",
};

// 発行者IDマッピング
const issuerIdMap = {
  デジタル庁: "https://www.digital.go.jp",
  TOEIC運営委員会: "https://www.toeic.or.jp",
  東京大学: "https://www.u-tokyo.ac.jp",
  早稲田大学: "https://www.waseda.jp",
  慶應義塾大学: "https://www.keio.ac.jp",
  京都大学: "https://www.kyoto-u.ac.jp",
  大阪大学: "https://www.osaka-u.ac.jp",
  一橋大学: "https://www.hit-u.ac.jp",
};

function convertToW3C(simpleVC) {
  const w3cVC = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1",
    ],
    type: ["VerifiableCredential", typeMap[simpleVC.type] || simpleVC.type],
    id: simpleVC.id,
    issuer: {
      id:
        issuerIdMap[simpleVC.issuer] ||
        `https://example.com/issuer/${encodeURIComponent(simpleVC.issuer)}`,
      name: simpleVC.issuer,
    },
    issuanceDate: simpleVC.issuedAt,
    credentialSubject: {
      id: `did:example:${simpleVC.id.replace("vc_", "")}`,
      ...simpleVC.attributes,
    },
  };

  if (simpleVC.description) {
    w3cVC.description = simpleVC.description;
  }
  if (simpleVC.verified !== undefined) {
    w3cVC.verified = simpleVC.verified;
  }

  return w3cVC;
}

// すべてのVCファイルを変換
const files = fs
  .readdirSync(vcsDir)
  .filter(
    (f) =>
      f.startsWith("student-") && f.endsWith(".json") && !f.includes("-w3c")
  );

files.forEach((file) => {
  const filePath = path.join(vcsDir, file);
  const simpleVC = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const w3cVC = convertToW3C(simpleVC);

  // 元のファイルをW3C形式で上書き
  fs.writeFileSync(filePath, JSON.stringify(w3cVC, null, 2) + "\n");
  console.log(`✅ Converted: ${file}`);
});

console.log(`\n✨ Converted ${files.length} VC files to W3C format`);
