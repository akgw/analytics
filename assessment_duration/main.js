const csv = require('csvtojson');
const startFile = "./resource/starts.csv";
const endFile = "./resource/ends.csv";

(async function () {
  const starts = await csv().fromFile(startFile);
  const ends = await csv().fromFile(endFile);
  
  const assessments = starts.concat(ends)
  let result = [];
  uniq(assessments.map(assessment => assessment.assessment_item_id)).map(assessment_item_id => {
    const tests = assessments.filter(assessment => assessment.assessment_item_id === assessment_item_id).sort((a,b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    let isStart = true;
    const targets = [];
    let assessmentDuration = 0;
    let lastTimestamp = '';
    let contactCount = 0;
    tests.forEach(assessment => {
      // startとendが交互になるようにする
      if (isStart === true && !assessment.path.includes('/start_evaluation')) {
        return;
      }

      if (isStart === false && assessment.path.includes('/start_evaluation')) {
        return;
      }

      // 終了のときに時間を加算
      if (!isStart) {
        contactCount += 1;
        assessmentDuration += Date.parse(assessment.timestamp) - Date.parse(lastTimestamp)
      }
      targets.push(assessment)
      lastTimestamp = assessment.timestamp
      isStart = !isStart
    })

    if (targets.length <= 0) {
      return;
    }

    result.push({
      assessmentItemId: assessment_item_id,
      duration: assessmentDuration / 1000,
      employeeNumber: targets[0].employee_number,
      contactCount: contactCount
    })
  })


  // 査定員ごとの中央値
  uniq(result.map(row => row.employeeNumber)).map(employeeNumber => {
    const durations = result.filter(row => row.employeeNumber === employeeNumber).map(row => row.duration)
    const counts = result.filter(row => row.employeeNumber === employeeNumber).map(row => row.contactCount)

    // 従業員あたりの取り扱い商材数
    const assessmentItemNum = uniq(assessments.filter(assessment => assessment.employee_number === employeeNumber).map(assessment => assessment.assessment_item_id)).length
    console.log(`${employeeNumber}\t${median(durations)}\t${assessmentItemNum}\t${sum(counts)}`)
  })

  // 全体の中央値
  console.log(median(result.map(row => row.duration)), result.length);
}());

const uniq = (array) => {
  return [...new Set(array)];
}

const median = (numbers) => {
  const half = (numbers.length / 2) | 0
  const arr = numbers.sort((a, b) => {
      return a - b;
  })

  if (arr.length % 2) {
      return arr[half]
  }
  return (arr[half - 1] + arr[half]) / 2
}

var sum  = function(arr) {
  return arr.reduce(function(prev, current, i, arr) {
      return prev+current;
  });
};