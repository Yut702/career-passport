const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const buildDir = path.join(__dirname, "../build");
const circuits = ["age", "toeic", "degree"];

console.log("🔧 Starting trusted setup...\n");

circuits.forEach((circuitName) => {
  const r1csPath = path.join(buildDir, `${circuitName}.r1cs`);
  const zkeyPath = path.join(buildDir, `${circuitName}.zkey`);
  const vkeyPath = path.join(buildDir, `${circuitName}.vkey.json`);

  if (!fs.existsSync(r1csPath)) {
    console.error(`❌ R1CS file not found: ${r1csPath}`);
    console.error(`   Please run 'npm run compile' first.`);
    return;
  }

  console.log(`🔐 Setting up ${circuitName}...`);

  try {
    // Phase 1: Powers of Tau
    const ptauPath = path.join(buildDir, "powersOfTau28_hez_final.ptau");

    if (!fs.existsSync(ptauPath)) {
      console.log(`   Downloading powers of tau...`);
      // 実際のプロダクションでは、適切なpowers of tauファイルを使用
      // ここでは簡易版として、snarkjsのデフォルトを使用
      execSync(
        `snarkjs powersoftau new bn128 14 ${path.join(
          buildDir,
          "pot14_0000.ptau"
        )} -v`,
        { stdio: "inherit" }
      );
      execSync(
        `snarkjs powersoftau contribute ${path.join(
          buildDir,
          "pot14_0000.ptau"
        )} ${path.join(
          buildDir,
          "pot14_0001.ptau"
        )} --name="First contribution" -v -e="random text"`,
        { stdio: "inherit" }
      );
      execSync(
        `snarkjs powersoftau prepare phase2 ${path.join(
          buildDir,
          "pot14_0001.ptau"
        )} ${ptauPath} -v`,
        { stdio: "inherit" }
      );
    }

    // Phase 2: Circuit-specific setup
    console.log(`   Generating zkey...`);
    execSync(`snarkjs groth16 setup ${r1csPath} ${ptauPath} ${zkeyPath}`, {
      stdio: "inherit",
    });

    // Contribution (実際のプロダクションでは、セキュアな方法で行う)
    console.log(`   Contributing to zkey...`);
    const zkeyFinalPath = path.join(buildDir, `${circuitName}_final.zkey`);
    execSync(
      `snarkjs zkey contribute ${zkeyPath} ${zkeyFinalPath} --name="Contributor" -v -e="another random text"`,
      { stdio: "inherit" }
    );

    // Export verification key
    console.log(`   Exporting verification key...`);
    execSync(
      `snarkjs zkey export verificationkey ${zkeyFinalPath} ${vkeyPath}`,
      { stdio: "inherit" }
    );

    // 最終的なzkeyを上書き
    fs.copyFileSync(zkeyFinalPath, zkeyPath);

    console.log(`✅ ${circuitName} setup completed!`);
    console.log(`   - ZKey: ${zkeyPath}`);
    console.log(`   - VKey: ${vkeyPath}\n`);
  } catch (error) {
    console.error(`❌ Failed to setup ${circuitName}:`, error.message);
    console.error(
      `   Note: This is a simplified setup. For production, use proper trusted setup ceremony.`
    );
    process.exit(1);
  }
});

console.log("✨ All circuits setup completed!");

// 検証鍵ファイル（公開情報）をfrontend/public/zkp/build/にコピー
console.log("\n📋 Copying verification keys to frontend/public/zkp/build/...");
const frontendVkeyDir = path.join(__dirname, "../../frontend/public/zkp/build");

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(frontendVkeyDir)) {
  fs.mkdirSync(frontendVkeyDir, { recursive: true });
}

circuits.forEach((circuitName) => {
  const vkeyPath = path.join(buildDir, `${circuitName}.vkey.json`);
  const frontendVkeyPath = path.join(
    frontendVkeyDir,
    `${circuitName}.vkey.json`
  );

  if (fs.existsSync(vkeyPath)) {
    try {
      fs.copyFileSync(vkeyPath, frontendVkeyPath);
      console.log(
        `   ✅ Copied ${circuitName}.vkey.json to frontend/public/zkp/build/`
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to copy ${circuitName}.vkey.json:`,
        error.message
      );
    }
  } else {
    console.warn(`   ⚠️  ${circuitName}.vkey.json not found, skipping...`);
  }
});

console.log("✨ Verification keys copied to frontend!");
