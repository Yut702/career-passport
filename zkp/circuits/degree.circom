// 学位証明回路
// 学位証明書VCが存在し、GPAが最小GPA以上であることを証明する
// 大学名、専攻、学位などの文字列情報は開示オプションで制御（ZKPではGPAのみ証明）

template DegreeProof() {
    // 秘密入力（プライベート）
    signal input gpa;                   // GPA（秘密）
    
    // 公開入力（パブリック）
    signal input minGpa;                // 最小GPA（公開、0の場合はチェックしない）
    
    // 出力
    signal output satisfied;            // 条件を満たしているか（1 or 0）
    
    // GPA条件のチェック
    // 注意：minGpaが0の場合は、フロントエンド側でチェックをスキップする
    component gpaCheck = GreaterEqThan(16);
    gpaCheck.in[0] <== gpa;
    gpaCheck.in[1] <== minGpa;
    
    satisfied <== gpaCheck.out;
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

component main = DegreeProof();

