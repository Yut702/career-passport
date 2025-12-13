// 年齢証明回路
// 生年月日から年齢を計算し、最小年齢条件を満たすことを証明する

template AgeProof() {
    // 秘密入力（プライベート）
    signal input dateOfBirthYear;    // 生年月日（年）
    signal input dateOfBirthMonth;  // 生年月日（月）
    signal input dateOfBirthDay;    // 生年月日（日）
    
    // 公開入力（パブリック）
    signal input currentYear;        // 現在の年
    signal input currentMonth;      // 現在の月
    signal input currentDay;        // 現在の日
    signal input minAge;            // 最小年齢（例: 25）
    
    // 出力
    signal output age;              // 計算された年齢
    signal output satisfied;        // 条件を満たしているか（1 or 0）
    
    // 年齢計算
    // 年齢 = 現在年 - 生年 - (現在月日 < 生年月日 ? 1 : 0)
    
    // 月日の比較（現在月日が生年月日より前かどうか）
    component monthDayCompare = LessThan(32);
    monthDayCompare.in[0] <== currentMonth * 100 + currentDay;
    monthDayCompare.in[1] <== dateOfBirthMonth * 100 + dateOfBirthDay;
    
    // 年齢計算
    age <== currentYear - dateOfBirthYear - monthDayCompare.out;
    
    // 年齢が最小年齢以上かどうかをチェック
    component ageCheck = GreaterEqThan(128);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;
    
    satisfied <== ageCheck.out;
}

// 比較演算コンポーネント（circomlibから使用）
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component n2b = Num2Bits(n);
    n2b.in <== in[0] + (1 << n) - in[1];
    out <== 1 - n2b.out[n-1];
}

template GreaterEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0] + 1;
    out <== lt.out;
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

component main = AgeProof();

