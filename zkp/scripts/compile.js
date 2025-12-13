const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const circuitsDir = path.join(__dirname, "../circuits");
const buildDir = path.join(__dirname, "../build");

// buildディレクトリが存在しない場合は作成
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// コンパイルする回路ファイル
const circuits = ["age", "toeic", "degree"];

console.log("🚀 Starting circuit compilation...\n");

circuits.forEach((circuitName) => {
  const circuitPath = path.join(circuitsDir, `${circuitName}.circom`);
  const wasmPath = path.join(buildDir, `${circuitName}.wasm`);
  const r1csPath = path.join(buildDir, `${circuitName}.r1cs`);

  if (!fs.existsSync(circuitPath)) {
    console.error(`❌ Circuit file not found: ${circuitPath}`);
    return;
  }

  console.log(`📦 Compiling ${circuitName}.circom...`);

  try {
    // circomでコンパイル（circom 0.5.xでは-oオプションが正しく動作しない場合があるため、
    // 現在のディレクトリでコンパイルしてから移動する）
    const currentDir = process.cwd();
    execSync(`circom ${circuitPath} --wasm --r1cs`, {
      stdio: "inherit",
      cwd: circuitsDir,
    });

    // 生成されたファイルをbuildディレクトリに移動
    const generatedWasm = path.join(circuitsDir, `${circuitName}.wasm`);
    const generatedR1cs = path.join(circuitsDir, `${circuitName}.r1cs`);

    if (fs.existsSync(generatedWasm)) {
      fs.renameSync(generatedWasm, wasmPath);
    }
    if (fs.existsSync(generatedR1cs)) {
      fs.renameSync(generatedR1cs, r1csPath);
    }

    console.log(`✅ ${circuitName} compiled successfully!`);
    console.log(`   - WASM: ${wasmPath}`);
    console.log(`   - R1CS: ${r1csPath}\n`);
  } catch (error) {
    console.error(`❌ Failed to compile ${circuitName}:`, error.message);
    process.exit(1);
  }
});

console.log("✨ All circuits compiled successfully!");
