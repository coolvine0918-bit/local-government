/**
 * ====================================================================
 * 중학교 사회 탐구 학습지 - Google Apps Script 백엔드 (Code.gs)
 * 대상 스프레드시트 ID: 16M3jqZL1vB7-doVdX-B-Eb-L2XbvQSozFYDB47AvU8c
 * ====================================================================
 * 
 * [시스템 설계 및 기능]
 * 1. 1페이지 점수는 [시트 1], 2페이지 점수는 [시트 2], 3페이지는 [시트 3]...
 *    앞으로 페이지가 계속 추가되어도 해당 페이지 번호에 맞춰 [시트 N]에 자동 기록됩니다.
 * 2. 만약 해당 번호의 시트가 없으면 자동으로 [시트 N]을 생성하고 헤더 서식을 적용합니다.
 * 3. GET(쿼리 파라미터) 및 POST(JSON 바디) 방식을 모두 지원하며 브라우저 CORS 제약을 완벽 지원합니다.
 * 
 * [배포 방법]
 * 1. 구글 스프레드시트 (ID: 16M3jqZL1vB7-doVdX-B-Eb-L2XbvQSozFYDB47AvU8c) 열기
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 3. 기본 내용을 모두 지우고 아래 코드를 그대로 붙여넣기 후 저장 (Ctrl+S)
 * 4. 우측 상단 [배포] > [새 배포] 클릭
 *    - 유형: [웹 앱] 선택
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' 선택 (학생 로그인 불필요)
 * 5. 발급된 '웹 앱 URL'을 복사하여 앱에 등록하면 연동이 완료됩니다!
 */

// ★ 사용자 지정 스프레드시트 ID
var SPREADSHEET_ID = '16M3jqZL1vB7-doVdX-B-Eb-L2XbvQSozFYDB47AvU8c';

// 1. 스프레드시트 객체 획득 (지정 ID 우선, 실패 시 활성 시트 사용)
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (err) {
    Logger.log('openById 실패, getActiveSpreadsheet() 시도: ' + err);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// 2. GET 요청 수신 처리 (웹 브라우저 no-cors GET 요청 대응)
function doGet(e) {
  if (e && e.parameter && (e.parameter.studentId || e.parameter.studentName || e.parameter.score || e.parameter.sheet || e.parameter.page)) {
    var result = recordScore(e.parameter);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 웹 브라우저에서 직접 URL 접속 시 테스트 및 상태 확인 화면 제공
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: '학습지 성적 기록 Google Apps Script 웹앱이 정상 작동 중입니다.',
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toLocaleString('ko-KR')
  })).setMimeType(ContentService.MimeType.JSON);
}

// 3. POST 요청 수신 처리 (웹 브라우저 no-cors POST 요청 대응)
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var result = recordScore(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 4. 통합 성적 기록 함수 (페이지별 시트 자동 생성 및 라우팅)
function recordScore(data) {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      throw new Error('스프레드시트를 열 수 없습니다. 권한 또는 스프레드시트 ID를 확인하세요.');
    }

    // 대상 시트 이름 결정:
    // data.page가 1이면 '시트 1', 2이면 '시트 2' ...
    // data.sheet가 '시트 1', '시트1' 등 전달된 경우 정규화
    var targetSheetName = resolveSheetName(data);

    // 시트 찾기 (공백 여부 '시트 1' 또는 '시트1' 모두 호환)
    var sheet = ss.getSheetByName(targetSheetName) ||
                ss.getSheetByName(targetSheetName.replace(' ', '')) ||
                ss.getSheetByName(targetSheetName.replace('시트', '시트 '));

    // 시트가 없으면 자동으로 생성
    if (!sheet) {
      sheet = ss.insertSheet(targetSheetName);
    }

    // 첫 행(헤더)이 비어있으면 헤더 자동 생성 및 스타일 적용
    if (sheet.getLastRow() === 0) {
      setupSheetHeader(sheet, targetSheetName, data);
    }

    // 데이터 추출 및 정리
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studentId = String(data.studentId || '').trim();
    var studentName = String(data.studentName || '').trim();
    var score = Number(data.score) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 0;
    var details = String(data.details || '').trim();

    // 맞힌 개수 문자열
    var countStr = totalQuestions > 0 ? (correctCount + ' / ' + totalQuestions) : (correctCount + '개');

    // 스피드 퀴즈 등 부가 정보(도전 회차, 소요 시간 등) 지원
    var attemptNumber = data.attemptNumber ? (data.attemptNumber + '회차') : '-';
    var timeSpent = data.timeSpent ? (data.timeSpent + '초') : (data.durationSeconds ? (data.durationSeconds + '초') : '-');

    // 시트 행 추가
    sheet.appendRow([
      studentId,
      studentName,
      score,
      timestamp,
      countStr,
      timeSpent,
      details
    ]);

    // 열 너비 자동 맞춤
    try {
      sheet.autoResizeColumns(1, 7);
    } catch (resizeErr) {
      // ignore
    }

    return {
      success: true,
      sheet: sheet.getName(),
      studentId: studentId,
      studentName: studentName,
      score: score,
      message: '[' + sheet.getName() + ']에 성공적으로 기록되었습니다.'
    };
  } catch (error) {
    Logger.log('기록 오류: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// 5. 페이지 번호 또는 시트 매개변수 기반 시트 이름 판별
function resolveSheetName(data) {
  // 1) page 파라미터 우선 (예: page=1 -> '시트 1')
  if (data.page !== undefined && data.page !== null && String(data.page).trim() !== '') {
    var pNum = parseInt(data.page, 10);
    if (!isNaN(pNum)) {
      return '시트 ' + pNum;
    }
  }

  // 2) sheet 또는 targetSheet 파라미터가 명시된 경우
  var sheetParam = String(data.sheet || data.targetSheet || '').trim();
  if (sheetParam) {
    // '시트1' -> '시트 1' 통일
    var match = sheetParam.match(/시트\s*(\d+)/i);
    if (match) {
      return '시트 ' + match[1];
    }
    return sheetParam;
  }

  // 3) type 기반 자동 판별 (기존 퀴즈 유형 호환)
  if (data.type === 'line_quiz' || data.quizType === 'line') return '시트 1';
  if (data.type === 'speed_quiz' || data.quizType === 'speed') return '시트 2';
  if (data.type === 'choice_quiz_20' || data.quizType === 'quiz3') return '시트 3';
  if (data.type === 'process_quiz_10' || data.quizType === 'quiz4') return '시트 4';
  if (data.type === 'case_quiz_10' || data.quizType === 'quiz5') return '시트 5';

  // 기본값: '시트 1'
  return '시트 1';
}

// 6. 시트 헤더 초기화 및 시각 디자인 서식
function setupSheetHeader(sheet, sheetName, data) {
  var headers = ['학번', '이름', '점수', '제출일시', '정답수 / 총문항', '소요시간', '세부 채점 내역'];
  sheet.appendRow(headers);

  // 시트 번호에 따른 테마 색상 지정
  var color = '#2563eb'; // 기본 파랑 (시트 1)
  if (sheetName.indexOf('2') !== -1) color = '#d97706'; // 호박색 (시트 2)
  else if (sheetName.indexOf('3') !== -1) color = '#059669'; // 에메랄드 (시트 3)
  else if (sheetName.indexOf('4') !== -1) color = '#7c3aed'; // 보라 (시트 4)
  else if (sheetName.indexOf('5') !== -1) color = '#db2777'; // 분홍 (시트 5)
  else if (sheetName.indexOf('6') !== -1) color = '#0891b2'; // 청록 (시트 6)
  else if (sheetName.indexOf('7') !== -1) color = '#4f46e5'; // 인디고 (시트 7)

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(color);
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 35);

  // 1행 고정
  sheet.setFrozenRows(1);
}

// 7. Apps Script 편집기 내 수동 테스트 함수
function testScoreSubmission() {
  var testData1 = {
    page: 1,
    studentId: '10101',
    studentName: '홍길동',
    score: 100,
    correctCount: 11,
    totalQuestions: 11,
    details: '1번(풀뿌리 민주주의):O | 2번(민주주의의 학교):O | 3번(광역 자치 단체):O'
  };
  var res1 = recordScore(testData1);
  Logger.log('1페이지 테스트 결과: ' + JSON.stringify(res1));

  var testData2 = {
    page: 2,
    studentId: '10102',
    studentName: '김철수',
    score: 90,
    correctCount: 9,
    totalQuestions: 10,
    details: '1번:O | 2번:O | 3번:X'
  };
  var res2 = recordScore(testData2);
  Logger.log('2페이지 테스트 결과: ' + JSON.stringify(res2));
}
