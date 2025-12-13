// TOEICスコア証明回路
// TOEICスコアが最小スコア以上であることを証明する（実際のスコアは非開示）

template ToeicProof() {
    // 秘密入力（プライベート）
    signal input score;              // TOEICスコア（実際の値、非開示）
    
    // 公開入力（パブリック）
    signal input minScore;           // 最小スコア（例: 800）
    
    // 出力
    signal output satisfied;         // 条件を満たしているか（1 or 0）
    
    // スコアが最小スコア以上かどうかをチェック
    component scoreCheck = GreaterEqThan(16);
    scoreCheck.in[0] <== score;
    scoreCheck.in[1] <== minScore;
    
    satisfied <== scoreCheck.out;
}

// 比較演算コンポーネント
template GreaterEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0] + 1;
    out <== lt.out;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component n2b = Num2Bits(n);
    n2b.in <== in[0] + (1 << n) - in[1];
    out <== 1 - n2b.out[n-1];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;
    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }
    lc1 === in;
}

component main = ToeicProof();

