pragma circom 2.0.0;

// 複合証明回路
// 複数の条件を同時に証明する（年齢 + TOEICスコアなど）

template CompositeProof() {
    // 年齢関連の入力
    signal input dateOfBirthYear;
    signal input dateOfBirthMonth;
    signal input dateOfBirthDay;
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal input minAge;
    
    // TOEIC関連の入力
    signal input toeicScore;
    signal input minToeicScore;
    
    // 出力
    signal output ageSatisfied;
    signal output toeicSatisfied;
    signal output allSatisfied;  // すべての条件を満たしているか
    
    // 年齢証明
    component ageProof = AgeProof();
    ageProof.dateOfBirthYear <== dateOfBirthYear;
    ageProof.dateOfBirthMonth <== dateOfBirthMonth;
    ageProof.dateOfBirthDay <== dateOfBirthDay;
    ageProof.currentYear <== currentYear;
    ageProof.currentMonth <== currentMonth;
    ageProof.currentDay <== currentDay;
    ageProof.minAge <== minAge;
    ageSatisfied <== ageProof.satisfied;
    
    // TOEIC証明
    component toeicProof = ToeicProof();
    toeicProof.score <== toeicScore;
    toeicProof.minScore <== minToeicScore;
    toeicSatisfied <== toeicProof.satisfied;
    
    // すべての条件を満たしているか
    allSatisfied <== ageSatisfied * toeicSatisfied;
}

// 年齢証明テンプレート
template AgeProof() {
    signal input dateOfBirthYear;
    signal input dateOfBirthMonth;
    signal input dateOfBirthDay;
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal input minAge;
    signal output age;
    signal output satisfied;
    
    component monthDayCompare = LessThan(32);
    monthDayCompare.in[0] <== currentMonth * 100 + currentDay;
    monthDayCompare.in[1] <== dateOfBirthMonth * 100 + dateOfBirthDay;
    
    age <== currentYear - dateOfBirthYear - monthDayCompare.out;
    
    component ageCheck = GreaterEqThan(128);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;
    
    satisfied <== ageCheck.out;
}

// TOEIC証明テンプレート
template ToeicProof() {
    signal input score;
    signal input minScore;
    signal output satisfied;
    
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

component main = CompositeProof();

