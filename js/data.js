/**
 * js/data.js
 * ------------------------------------------------------------
 * '어두운 밤숲과 5개의 촛불' 포트폴리오 통합 데이터 설정 파일
 * - 로컬 file:// 환경 CORS 회피를 위해 전역 객체(window.PORTFOLIO_DATA)로 로드합니다.
 * - '// TODO:' 주석이 표시된 항목을 실제 운영 URL/ID로 교체하시면 즉시 반영됩니다.
 */

window.PORTFOLIO_DATA = {
  siteConfig: {
    siteTitle: '이준영 | 고요한 밤숲의 서재 — iOS Developer · QA · Creator',
    siteDescription:
      '기획·상용 iOS 앱 개발(PosePik, Lumio)·SW QA 검증·영상·스토리텔링을 아우르는 이준영의 인터랙티브 이력서 및 멀티 포맷 포트폴리오',
    // TODO: GitHub Pages 또는 Cloudflare Pages 실제 배포 도메인으로 교체하세요.
    canonicalUrl: 'https://your-portfolio-domain.pages.dev/',
    defaultVolume: 0.45 // 초기 권장 사운드 볼륨 (45%)
  },

  analyticsConfig: {
    // TODO: Google Analytics 4 측정 ID를 입력하세요 (예: 'G-XXXXXXXXXX'). 비워두면 로드하지 않습니다.
    gaMeasurementId: '',
    // TODO: Cloudflare Web Analytics 토큰을 입력하세요. 비워두면 로드하지 않습니다.
    cloudflareToken: '',
    // TODO: 실서비스 배포 시 콘솔 로그를 끄려면 false로 변경하세요.
    debugMode: true
  },

  profile: {
    name: '이준영',
    englishName: 'Junyoung Lee',
    tagline: 'iOS Developer · QA · Creator',
    eyebrow: 'MIDNIGHT FOREST STUDY',
    headline: '어두운 밤숲, 다섯 개의 촛불로 기록한 설계와 검증, 그리고 이야기',
    subHeadline: '원하는 촛불을 켜서 이력과 상용 iOS 앱, QA 리포트, 영상 아카이브, 창작 서재를 살펴보세요.',
    summary:
      '사용자 문제를 프로덕트로 정의하고 직접 설계·출시까지 완주하는 메이커이자, 꼼꼼한 시선으로 품질을 증명하는 QA·크리에이터입니다. AI 카메라 포즈 가이드 앱 PosePik과 FSRS 기반 스마트 플래시카드 앱 Lumio를 App Store에 정식 출시·운영하고 있으며, 시스템·웹·클라우드 개발 및 서버 QC 실무 경험(4년+), LLM 웹앱 220+ 테스트케이스 설계 및 Appium 모바일 테스트 자동화, 브랜드 영상편집·모션그래픽, 단·중편 스토리 창작까지 다층적인 역량을 하나의 서사에 담았습니다.',
    email: 'younghwen@naver.com',
    linkedinUrl: 'https://www.linkedin.com/in/younghwen/',
    linkedinLabel: 'linkedin.com/in/younghwen',
    // 워크스페이스 루트에 위치한 프로필 이미지 파일명 (런타임에서 NFD/NFC 양방향 폴백 처리)
    cardProfilePhoto: '커피잔프로필사진.png',
    resumePhoto: '프로필.jpg',
    keywords: [
      '#iOS_Product_Maker',
      '#Swift_Vision_CoreML',
      '#QA_TestAutomation',
      '#Appium_FastAPI',
      '#Premiere_AfterEffects',
      '#Storytelling'
    ],
    highlights: [
      {
        label: '상용 iOS 앱',
        value: '2종 정식 출시',
        detail: 'PosePik · Lumio 기획, Swift 온디바이스 AI 구현 및 실기기 검증·운영'
      },
      {
        label: '개발 · QC 실무',
        value: '4년+ 경력',
        detail: '자동화 시스템·웹/클라우드(React, Node.js)·서버 리소스 QC 리포팅'
      },
      {
        label: 'QA & AI 역량',
        value: '219 TC · 자동화',
        detail: '구마야 산책가자 QA 주도(219 TC), FastAPI+Appium 자동화, NVIDIA AI Academy'
      },
      {
        label: '영상 · 창작',
        value: '멀티 포맷 스토리',
        detail: 'V커머스 영상편집·GTQ 1급 · 단·중편 시나리오 집필'
      }
    ]
  },

  candlesMeta: [
    {
      id: 1,
      numeral: '제1초',
      title: '기록과 증명',
      subtitle: 'Profile & Docs',
      tooltip: '프로필 요약 · 올라운더 역량 · 웹 이력서 & 자기소개서',
      panelEyebrow: 'CANDLE I · PROFILE & CREDENTIALS',
      panelTitle: '기록과 증명 — 올라운더 메이커의 이력'
    },
    {
      id: 2,
      numeral: '제2초',
      title: '설계와 구현',
      subtitle: 'Commercial iOS',
      tooltip: '상용 출시 iOS 앱 — PosePik & Lumio 아키텍처',
      panelEyebrow: 'CANDLE II · COMMERCIAL iOS PRODUCTS',
      panelTitle: '설계와 구현 — App Store 상용 iOS 앱'
    },
    {
      id: 3,
      numeral: '제3초',
      title: '시선과 검증',
      subtitle: 'Video & SW QA',
      tooltip: '대표 포트폴리오 영상 · SW QA & 테스트 자동화',
      panelEyebrow: 'CANDLE III · VISION & QUALITY ASSURANCE',
      panelTitle: '시선과 검증 — 대표 영상 & QA 엔지니어링'
    },
    {
      id: 4,
      numeral: '제4초',
      title: '장면과 호흡',
      subtitle: 'YouTube & Music',
      tooltip: '유튜브 채널(@younghwen) · 영화 OST·명장면 해석 & 오리지널 창작곡',
      panelEyebrow: 'CANDLE IV · YOUTUBE & SOUND ARCHIVE',
      panelTitle: '장면과 호흡 — 유튜브 채널 & 대표 콘텐츠'
    },
    {
      id: 5,
      numeral: '제5초',
      title: '문장과 밤',
      subtitle: 'Stories & E-Book',
      tooltip: '창작 단편·중편 서재 · 촛불 E-Book 전용 리더기',
      panelEyebrow: 'CANDLE V · WORDS IN THE NIGHT',
      panelTitle: '문장과 밤 — 창작 원고 서재 & 촛불 리더기'
    }
  ],

  // 제1초 [기록과 증명] 웹페이지 내 바로보기용 LinkedIn & 경력 요약 데이터
  // TODO: LinkedIn 프로필 문구를 추가로 반영하려면 아래 항목을 자유롭게 편집하세요.
  linkedinProfile: {
    badge: 'CAREER & LINKEDIN SNAPSHOT',
    headline: 'iOS Product Maker (PosePik · Lumio) · SW QA & Mobile Test Automation · Creator',
    about:
      '문제를 발견하면 직접 기획·설계·코드 구현·실기기 검증·출시까지 완주하는 1인 프로덕트 메이커입니다. 상용 iOS 앱 PosePik과 Lumio를 App Store에 출시·운영하고 있으며, 시스템·웹·클라우드 개발 및 서버 QC 실무 경험(4년+), LLM 웹앱 220+ 테스트케이스 설계 및 FastAPI + Appium 모바일 테스트 자동화, 브랜드 영상편집·모션그래픽 역량을 결합해 사용자 경험을 끝까지 검증하고 완성합니다.',
    experiences: [
      {
        period: '현재 운영 중',
        role: '1인 상용 iOS 프로덕트 메이커 (기획 · 개발 · QA · 운영)',
        org: 'PosePik (포즈픽) & Lumio (루미오)',
        desc: 'Vision·CoreML 실시간 카메라 포즈 가이드 무료 앱 PosePik(posepik.com) 및 FSRS·온디바이스 OCR·WidgetKit·watchOS 플래시카드 앱 Lumio(lumioapp.win) 정식 출시·실기기 QA 운영.'
      },
      {
        period: '2025.07 ~ 2025.12',
        role: 'AI 반려견 어시스턴트("구마야 산책가자") 주도적 QA · LLM RAG · 지도 개발',
        org: 'NVIDIA AI Academy · 1차 프로젝트',
        desc: '팀 내 QA 프로세스를 주도하여 219개 테스트케이스(TC) 작성·27건 결함 관리·최종 품질 결과 보고서(PASS 93.2%)를 완성하고, LLM 챗봇 RAG 구현과 플레이스 지도·마커 클러스터링·FastAPI+Appium 모바일 테스트 자동화를 수행.'
      },
      {
        period: '2021.12 ~ 2022.06',
        role: '서버 리소스 QC 매니저 (파견)',
        org: '신용데이터 기업 CB개발부',
        desc: 'Linux Shell 환경에서 파견사 서버 CPU/RAM 점유율 상시 모니터링 및 일별·주간·2주·월별 컴퓨팅 리소스 정량 데이터 추출·보고 수행.'
      },
      {
        period: '2012.10 ~ 2018.07',
        role: '소프트웨어 · 프론트엔드 · 자동화 시스템 개발자 (경력 4년+)',
        org: '클라우드 포털 · 빅데이터 플랫폼 · 자동화 시스템 개발사',
        desc: 'React·Node.js 클라우드 포털 대시보드 개발, PHP/JS CMS 리뉴얼, 빅데이터 플랫폼 "라온 2.0" 업그레이드, C# 물류/공장 자동화 시스템 및 DB 설계·시운전.'
      }
    ],
    education: [
      '한국표준협회 — [엔비디아] NVIDIA AI Academy 수료 (AI · 머신러닝 · 딥러닝, 2025.07 ~ 2025.12)',
      '콘센트릭스서비스코리아 — Avalon_iOS 기술 지원 과정 수료 (2024.08 ~ 2024.09)',
      '이젠아카데미 DX교육센터 — V커머스·브랜드 영상콘텐츠 편집제작 수료 (Premiere, After Effects, PS, AI, 2024.02 ~ 2024.07)',
      '남서울대학교 — 지구·지리학 / GIS공학과 학사 졸업 (IT 연합동아리 SOPT 6기 개발파트)'
    ],
    certifications: [
      'GTQ(그래픽기술자격) 1급 · GTQi(일러스트) 2급 — 한국생산성본부 (2024)',
      '정보처리기능사 · 정보기기운용기능사 — 한국산업인력공단',
      '컴퓨터활용능력 2급 · 워드프로세서 — 대한상공회의소'
    ]
  },

  // 웹페이지 내 전용 모달로 바로 볼 수 있는 공식 이력서 데이터
  // TODO: 경력·학력·훈련·자격증 항목을 수정하면 공식 웹 이력서 모달에 즉시 반영됩니다.
  resumeData: {
    badge: 'OFFICIAL WEB RESUME',
    title: '이준영 공식 이력서',
    subtitle: '상용 iOS 프로덕트 메이커 · 4년+ 개발 및 서버 QC 실무 · 주도적 SW QA & 자동화',
    header: {
      name: '이준영',
      englishName: 'Junyoung Lee',
      role: 'iOS Developer · SW QA & Test Automation · Creator',
      photo: '프로필.jpg',
      email: 'younghwen@naver.com',
      linkedinUrl: 'https://www.linkedin.com/in/younghwen/',
      linkedinLabel: 'linkedin.com/in/younghwen',
      links: [
        { label: 'PosePik (posepik.com)', url: 'https://posepik.com' },
        { label: 'Lumio (lumioapp.win)', url: 'https://lumioapp.win' },
        { label: 'YouTube (@younghwen)', url: 'https://www.youtube.com/@younghwen' }
      ],
      metrics: [
        { label: '실무 개발 · QC', value: '4년 1개월+' },
        { label: '상용 iOS 앱', value: '2종 정식 출시' },
        { label: 'QA · 테스트 자동화', value: '219 TC · Appium' },
        { label: '자격 · 전문교육', value: '자격증 7종 · 10과정' }
      ]
    },
    sections: [
      { id: 'career', num: '01', tabLabel: '경력 · 프로덕트', title: '경력사항 및 상용 프로덕트 (실무 4년 1개월 + 메이킹)' },
      { id: 'education', num: '02', tabLabel: '학력 · 대외활동', title: '학력사항 및 주요 대외·연구 활동' },
      { id: 'training', num: '03', tabLabel: '직업훈련 (10)', title: '직업훈련 및 전문교육 이수이력' },
      { id: 'certifications', num: '04', tabLabel: '자격증 · 역량', title: '보유 자격면허 및 핵심 기술 역량' }
    ],
    careers: [
      {
        category: '상용 프로덕트',
        period: '현재 운영 중',
        org: 'PosePik (포즈픽) & Lumio (루미오)',
        position: '1인 프로덕트 메이커',
        duties: '온디바이스 Vision·CoreML 실시간 카메라 포즈 가이드 무료 앱 PosePik 및 FSRS·온디바이스 OCR·WidgetKit·watchOS 플래시카드 앱 Lumio 기획·개발·실기기 QA·출시 운영',
        stack: 'Swift · Vision · CoreML · AVFoundation · WidgetKit · watchOS'
      },
      {
        category: 'AI · QA 프로젝트',
        period: '2025.07 ~ 2025.12',
        org: '구마야 산책가자 (NVIDIA AI Academy)',
        position: 'QA 리드 · AI LLM/LBS(위치기반서비스) 개발',
        duties: '219개 테스트케이스(TC) 설계·27건 결함 관리·최종 품질 보고서(PASS 87.7%→93.2%) 주도, LLM 챗봇 RAG 구축, 플레이스 지도·마커 클러스터링 및 FastAPI+Appium 모바일 자동화 구현',
        stack: 'SW QA · LLM RAG · FastAPI · Appium · Python'
      },
      {
        category: '실무 경력',
        period: '2021.12 ~ 2022.06',
        org: '기업·개인 신용데이터 기업 (파견)',
        position: 'CB개발부 · 매니저',
        duties: '서버 리소스 QC — 파견사 서버 CPU·RAM 점유율 상시 모니터링 및 일별·주간·2주·월별 리소스 작업·보고, 데이터 추출 및 컴퓨팅 리소스 조회 기반 월별 보고서(Excel, PowerPoint) 작성',
        stack: 'Linux Shell Script · Server QC · Excel · PowerPoint'
      },
      {
        category: '실무 경력',
        period: '2018.04 ~ 2018.07',
        org: '클라우드 솔루션 개발사',
        position: '대리',
        duties: '클라우드 포털 대시보드 프론트엔드 및 서비스 연동 개발',
        stack: 'React · Node.js'
      },
      {
        category: '실무 경력',
        period: '2017.10 ~ 2018.03',
        org: '웹 · CMS 구축 에이전시',
        position: '주임',
        duties: '회사 홈페이지(CMS) 전면 리뉴얼 구축 및 프론트엔드 스크립트 구현',
        stack: 'PHP · JavaScript · jQuery'
      },
      {
        category: '실무 경력',
        period: '2015.08 ~ 2016.01',
        org: '공장 자동화 프로그램 개발사',
        position: '기술개발2팀 · 사원',
        duties: '공장 자동화 프로그램(육상자동출하시스템, 공정 리포트) 및 사내 전산 프로그램(재고관리·업무일지·유지보수관리) 개발·유지보수, 서버 복구 지원',
        stack: 'C# · .NET · RDBMS'
      },
      {
        category: '실무 경력',
        period: '2014.07 ~ 2015.07',
        org: '빅데이터 플랫폼 벤처기업',
        position: '플랫폼개발팀 · 선임연구원',
        duties: '빅데이터 플랫폼 프로젝트(‘라온 2.0’) 업그레이드 개발, 프론트엔드 및 공식 회사 홈페이지 개발·운영, 공모전·사업 기획서 작성 보조',
        stack: 'Front-End · Big Data Platform · Web'
      },
      {
        category: '실무 경력',
        period: '2012.10 ~ 2013.10',
        org: '물류 · 자동화창고 시스템 개발사',
        position: '시스템개발부 · 사원',
        duties: '자동화창고·냉동창고·와이어하네스 창고 시스템 DB 설계, 커스터마이징 프로그래밍, 현장 설치 및 시운전',
        stack: 'DB 설계 · System Programming'
      }
    ],
    education: [
      {
        period: '2005.03 ~ 2012.02',
        school: '남서울대학교',
        major: '지구·지리학 / GIS공학과',
        degree: '대학교(4년제) 졸업',
        gpa: '3.44 / 4.5'
      }
    ],
    activities: [
      {
        period: '2010.03 ~ 2010.11',
        type: '연합동아리 · 공모전',
        org: '대학생 연합 IT 벤처 동아리 SOPT · 충남테크노파크',
        role: '6기 개발파트 · 청년CEO 500 창업공모전',
        desc: 'SOPT 6기 개발파트 활동 및 IT 컨퍼런스·네트워킹 참여, 충남테크노파크 청년CEO 500 프로젝트 창업공모전 아이디어 선정 및 수행'
      },
      {
        period: '2008.07 ~ 2008.09',
        type: '교내 연구실',
        org: '남서울대학교 지능형교통연구소',
        role: '국가근로장학생',
        desc: '학과장 교수님 연구 랩 하계 국가근로장학생으로 선발되어 석·박사 과정 대학원생 연구 및 보고서 작성 보조'
      },
      {
        period: '2007.02 ~ 2011.09',
        type: '리서치 · 실무보조',
        org: '부동산경제연구소 (분당 소재)',
        role: '기획서 보조 아르바이트',
        desc: '학업과 병행하며 시장조사, 연구 자료 정리 및 기획·보고서 작성 보조 업무 수행'
      }
    ],
    trainings: [
      {
        period: '2025.07 ~ 2025.12',
        org: '한국표준협회',
        course: '[엔비디아] NVIDIA AI Academy',
        detail: 'AI 인공지능, 머신러닝, 딥러닝 및 실전 프로젝트 교육 수료'
      },
      {
        period: '2024.08 ~ 2024.09',
        org: '콘센트릭스서비스코리아 유한회사',
        course: 'Avalon_iOS Wave132 (채용예정자 · 재직자 Nesting)',
        detail: 'iOS 디바이스 생태계 및 IT 기술 지원 상담 전문 교육'
      },
      {
        period: '2024.02 ~ 2024.07',
        org: '이젠아카데미 DX교육센터',
        course: 'V커머스, 브랜드 영상콘텐츠 편집제작',
        detail: 'Premiere Pro, After Effects, Photoshop, Illustrator, 마케팅 및 영상 편집 교육'
      },
      {
        period: '2023.08 ~ 2023.09',
        org: '(재)이노베이션아카데미',
        course: '42서울 10기 2차 1개월 집중교육과정',
        detail: '자기주도·동료학습 기반 C 프로그래밍 및 알고리즘 집중 과정'
      },
      {
        period: '2022.11 ~ 2022.12',
        org: '한국직장인교육센터 평생교육원',
        course: '빅데이터는 나의 친구_나도 빅데이터 전문가',
        detail: '빅데이터 분석 기초 및 활용 교육'
      },
      {
        period: '2014.10 ~ 2014.11',
        org: '정보통신산업진흥원 (NIPA)',
        course: 'Open API를 활용한 전자정부 빅데이터 분석 실무',
        detail: '공공 Open API 데이터 연동 및 빅데이터 분석 실무'
      },
      {
        period: '2014.09',
        org: '대한상공회의소 서울기술교육센터',
        course: '웹 접근성 이니셔티브를 적용한 인터랙션 디자인',
        detail: '웹 접근성 표준(WAI) 기반 UI 인터랙션 설계'
      },
      {
        period: '2014.08',
        org: '블로터아카데미',
        course: '워드프레스 웹 제작 실무',
        detail: '워드프레스 CMS 기반 웹사이트 제작 실무'
      },
      {
        period: '2014.03 ~ 2014.07',
        org: '국제인재개발원',
        course: '사물인터넷(IoT) 과정 (JAVA, C)',
        detail: 'Java, C 프로그래밍 및 사물인터넷 시스템 기초'
      },
      {
        period: '2013.05',
        org: '마이평생교육원',
        course: '스피치전문가반 과정',
        detail: '프레젠테이션 전달력 및 커뮤니케이션 집중 교육 (4일 과정)'
      }
    ],
    certifications: [
      { name: 'GTQ(그래픽기술자격) 1급', issuer: '한국생산성본부', date: '2024.04.05' },
      { name: 'GTQi(그래픽기술자격 일러스트) 2급', issuer: '한국생산성본부', date: '2024.05.05' },
      { name: '자동차운전면허 1종보통', issuer: '경기남부경찰청', date: '2012.12.03' },
      { name: '워드프로세서', issuer: '대한상공회의소', date: '2002.12.01' },
      { name: '정보기기운용기능사', issuer: '한국산업인력공단', date: '2000.08.01' },
      { name: '정보처리기능사', issuer: '한국산업인력공단', date: '1999.08.06' },
      { name: '컴퓨터활용능력 2급', issuer: '대한상공회의소', date: '1999.08.06' }
    ],
    skillGroups: [
      {
        group: 'iOS · Mobile Product',
        items: 'Swift, Vision Framework, CoreML, AVFoundation, FSRS 알고리즘, On-Device OCR, WidgetKit, watchOS'
      },
      {
        group: 'SW QA · Test Automation',
        items: '테스트케이스(TC) 설계, 결함 리포팅 및 품질 결과 보고서, FastAPI + Appium + Android SDK 모바일 UI 자동화, Linux Shell 서버 리소스 QC'
      },
      {
        group: 'Web · System · AI',
        items: 'React, Node.js, JavaScript, jQuery, PHP, Python, LLM RAG, C#, RDBMS 설계'
      },
      {
        group: 'Media · Office 활용능력',
        items: 'Premiere Pro, After Effects, Photoshop(GTQ 1급), Illustrator(GTQi 2급), 문서작성(워드프로세서), 표계산(Excel 데이터 추출·정량 분석), 프레젠테이션(PowerPoint 보고서)'
      }
    ]
  },

  // 웹페이지 내 전용 모달로 바로 읽을 수 있는 자기소개서 데이터
  // TODO: 각 챕터의 문단(paragraphs)이나 경력 상세(careerItems)를 수정하면 즉시 모달에 반영됩니다.
  coverLetter: {
    badge: 'COVER LETTER · 5 CHAPTERS',
    title: '이준영 자기소개서',
    subtitle: '긍정과 성실함으로 문제를 정의하고, 구현과 QA 검증으로 끝까지 완주하는 메이커',
    highlights: [
      { label: '핵심 정체성', value: 'iOS 메이커 · SW QA' },
      { label: '실무 및 프로덕트', value: '4년+ 경력 · 상용 앱 2종' },
      { label: '검증 및 자동화', value: '219 TC · Appium 자동화' }
    ],
    sections: [
      {
        id: 'personality',
        num: '01',
        tabLabel: '성격 · 태도',
        title: '성격의 장단점과 컨디션 루틴',
        lead: '긍정적인 시선으로 해결책을 찾고, 섬세한 감각을 품질 검증의 강점으로 바꾸며 꾸준한 루틴으로 지속 가능성을 지킵니다.',
        paragraphs: [
          '제 성격의 가장 큰 장점은 긍정적인 사고입니다. 예상치 못한 문제나 낯선 환경에서도 당황하기보다 그 안에서 배울 수 있는 점과 해결의 실마리를 먼저 바라보려 합니다.',
          '반면 섬세하고 예민한 감성을 지니고 있습니다. 사용자 경험의 미세한 어색함이나 예외 케이스를 잡아내는 개발·QA 검증과 창작 작업에서는 큰 강점이 되지만, 때로 신경을 깊이 쓰다 보면 피로가 쉽게 쌓이기도 합니다. 이를 스스로 잘 알고 있기에 평소 산책과 운동으로 체력을 기르고, 일정한 일과 루틴을 유지하며 컨디션을 체계적으로 관리하고 있습니다.'
        ]
      },
      {
        id: 'values',
        num: '02',
        tabLabel: '가치관 · 도약',
        title: '가치관과 끊임없는 셀프 테스트',
        lead: '공백의 시간을 성찰과 학습 루틴으로 채우고, 배운 기술을 실제 상용 프로덕트 출시까지 연결해 스스로 가능성을 증명했습니다.',
        paragraphs: [
          '코로나 이후 뜻하지 않은 경력 공백기와 이전에 겪어보지 못한 여러 스트레스가 겹치며 긴 인내의 시간을 지나온 적이 있습니다. 쉽지 않은 시기였지만 다시 사회와 현업에서 제 몫을 다하기 위해 스스로를 깊이 돌아보고 삶의 태도를 단단히 다지는 성찰의 시간으로 삼고자 노력했습니다.',
          '소프트웨어 엔지니어와 메이커는 끊임없이 새로운 기술을 배우고 검증해야 하는 직무이기에, 행동과 완주로 제 가능성을 직접 셀프 테스트했습니다. 42서울 집중교육과정과 V커머스·브랜드 영상편집 과정(GTQ 1급·GTQi 2급 취득), Avalon_iOS 기술 지원 교육을 거쳐, 한국표준협회 NVIDIA AI Academy 과정을 매일 9-to-6 루틴으로 흔들림 없이 수료하며 선택에 대한 책임감과 새로운 분야도 빠르게 흡수할 수 있다는 자신감을 얻었습니다.',
          '나아가 배움에만 머무르지 않고, 일상의 문제를 직접 정의해 App Store에 두 개의 상용 iOS 앱을 정식 출시·운영하고 있습니다. 온디바이스 Vision·CoreML 기반 실시간 AI 카메라 포즈 가이드 앱 ‘PosePik(포즈픽)’과, FSRS 망각곡선 알고리즘·온디바이스 OCR·WidgetKit·watchOS를 아우르는 스마트 플래시카드 앱 ‘Lumio(루미오)’를 기획부터 코드 구현, 실기기 필드 QA, 웹 랜딩 운영까지 1인 풀사이클로 완주하며 매일 성장하고 있습니다.'
        ]
      },
      {
        id: 'school',
        num: '03',
        tabLabel: '성장배경',
        title: '학창시절과 IT 메이커의 뿌리',
        lead: '어린 시절 첫 컴퓨터 자격증부터 대학 연구소와 연합 IT 동아리 SOPT까지, 성실함과 호기심으로 기반을 다져왔습니다.',
        paragraphs: [
          '초등학교 시절 훌륭한 컴퓨터학원 은사님을 만나 일찍부터 IT와 컴퓨터에 깊은 흥미를 느꼈습니다. 그 시기 정보처리기능사, 정보기기운용기능사, 컴퓨터활용능력 2급, 워드프로세서 자격증을 취득했고 수학경시대회에서도 여러 차례 최우수상을 받았습니다. 동시에 농구·야구·축구와 달리기를 좋아해 학급 대표로 뛰고, 아버지와 3박 4일간 지리산 천왕봉을 등반하는 등 몸과 마음이 건강한 어린 시절을 보냈습니다.',
          '중학교 시절에는 음악 감상과 컴퓨터 게임을 즐기며 친구들과 두루 어울려 졸업 때 우정상을 받았고, 고등학교 시절에는 시 작문에 관심을 두는 한편 고1 때 2박 3일간 소록도 봉사활동에 다녀오며 나눔의 가치를 배웠습니다. 또한 로봇축구동아리에서 활동하며 KAIST에서 열린 대회에 참가해 소프트웨어와 하드웨어가 맞물려 움직이는 즐거움을 경험했습니다.',
          '남서울대학교 지구·지리학 및 GIS공학과에 진학한 뒤에는 학업과 아르바이트를 병행하며 주위로부터 성실하다는 평가를 받았습니다. 분당 소재 부동산경제연구소에서 장기간 시장조사·기획서 작성 보조 업무를 수행했고, 군 전역 복학 후에는 성적장학금을 받으며 교내 지능형교통연구소 국가근로장학생으로 선발되어 석·박사 과정 연구원들의 보고서 작업을 도왔습니다. 더불어 수도권 대학 연합 IT 벤처 동아리 ‘SOPT’ 6기 개발파트로 활동하며 폭넓은 네트워킹을 쌓았고, 충남 청년CEO 500 창업공모전에서 아이디어가 선정되어 프로젝트를 진행하는 등 치열하게 도전하며 3.44 / 4.5 학점으로 졸업했습니다.'
        ]
      },
      {
        id: 'career',
        num: '04',
        tabLabel: '경력기술서',
        title: '경력 상세 기술서 및 상용 앱 메이킹',
        lead: '물류·공장 자동화, 빅데이터, 클라우드 웹 개발, 서버 리소스 QC 실무(4년+)와 1인 상용 iOS 프로덕트 운영 경험을 잇습니다.',
        careerItems: [
          {
            period: '현재 운영 중',
            org: 'PosePik & Lumio',
            role: '1인 상용 iOS 프로덕트 메이커 (기획 · 개발 · 실기기 QA · 운영)',
            companyDesc: 'App Store 정식 출시 모바일 프로덕트 (posepik.com · lumioapp.win)',
            tasks: [
              'Swift · Vision · CoreML · AVFoundation 기반 실시간 카메라 포즈 가이드 무료 앱 PosePik 개발·출시 및 솔로 모드 업데이트',
              'FSRS 간격 반복 알고리즘 · 온디바이스 OCR · WidgetKit · Apple Watch 연동 스마트 플래시카드 앱 Lumio 개발·출시',
              '역광·저조도·발열, 실제 인쇄물 OCR, iPhone–Watch 오프라인 동기화 등 시뮬레이터 한계를 보완한 실기기 회귀 QA 수행'
            ]
          },
          {
            period: '2021.12 ~ 2022.06',
            org: '기업·개인 신용데이터 기업 (파견)',
            role: 'CB개발부 · 매니저 (서버 리소스 QC)',
            companyDesc: '기업 및 개인 신용데이터 전문 기업',
            tasks: [
              'Linux Shell 스크립트 환경에서 파견사 서버 CPU 및 RAM 점유율 상시 모니터링(QC) 수행',
              '일별 · 주간 · 2주 · 월별 컴퓨팅 리소스 점검 작업 수행 및 이상 징후 보고',
              '월간 품질·리소스 보고서 작성을 위한 원시 데이터 추출 및 Excel · PowerPoint 정량 시각화 리포팅'
            ]
          },
          {
            period: '2017.10 ~ 2018.07',
            org: '클라우드 · 웹 솔루션 개발사',
            role: '클라우드 포털 개발 대리 · 웹 개발 주임',
            companyDesc: '클라우드 대시보드 및 기업 웹·CMS 구축 기업',
            tasks: [
              'React · Node.js 기반 클라우드 포털 대시보드 프론트엔드 및 연동 기능 개발',
              'PHP · JavaScript · jQuery 기반 회사 홈페이지(CMS) 전면 리뉴얼 구축'
            ]
          },
          {
            period: '2015.08 ~ 2016.01',
            org: '공장 자동화 프로그램 개발사',
            role: '기술개발2팀 · 사원',
            companyDesc: '산업·공장 자동화 소프트웨어 전문 개발 기업',
            tasks: [
              'C# 기반 사내 전산 시스템 개발 및 유지보수 (재고관리, 업무일지, 유지보수관리내역 시스템)',
              '고객사 육상자동출하시스템 운영 유지보수 및 안정화 지원',
              '고객사 공정 리포트(REPORT) 프로그램 개발 및 장애 서버 복구 수행'
            ]
          },
          {
            period: '2014.07 ~ 2015.07',
            org: '빅데이터 플랫폼 벤처기업',
            role: '플랫폼개발팀 · 선임연구원',
            companyDesc: '빅데이터 분석 플랫폼 스타트업·벤처 기업',
            tasks: [
              '주력 빅데이터 플랫폼 ‘라온 2.0’ 업그레이드 및 프론트엔드 개발',
              '공식 회사 홈페이지 구축 오픈 및 상시 운영',
              '스타트업 유통 아이디어 공모전 기획서 작성 보조 및 공공 빅데이터 분석 실무 연계'
            ]
          },
          {
            period: '2012.10 ~ 2013.10',
            org: '물류 · 창고 자동화 시스템 개발사',
            role: '시스템개발부 · 사원',
            companyDesc: '스마트 물류 및 자동화 창고 시스템 구축 기업',
            tasks: [
              '고객사 냉동창고 및 자동화창고 제어·관리 시스템 DB 설계, 커스터마이징 개발, 현장 설치 및 시운전',
              '고객사 와이어하네스 자동화 창고 시스템 고도화 업그레이드'
            ]
          }
        ]
      },
      {
        id: 'motivation',
        num: '05',
        tabLabel: '지원동기 · 포부',
        title: '지원동기와 팀에 기여하는 방식',
        lead: '코드를 이해하는 QA이자 품질을 끝까지 책임지는 개발자로서, 맡은 일을 빈틈없이 완수하는 신뢰받는 팀원이 되겠습니다.',
        paragraphs: [
          '인공지능 개발자 교육과정에서 AI 기반 반려견 산책·케어 어시스턴트 웹앱(‘구마야 산책가자’) 팀 프로젝트를 수행하며, LLM 챗봇 RAG 파이프라인과 현재 위치 기반 플레이스 지도·마커 클러스터링을 직접 개발하는 동시에 팀 내 QA 리드를 맡았습니다. 과거 수료했던 SW QA 교육과 서버 QC 실무 경험을 바탕으로 총 219개의 테스트케이스(TC)를 설계·수행하고 27건의 결함을 도출했으며, 수정 재검증을 거쳐 PASS율을 87.7%에서 93.2%까지 끌어올린 최종 테스트 결과 보고서를 완성했습니다.',
          '또한 Python과 AI를 학습하며 품질 검증을 자동화로 확장하기 위해 FastAPI + Appium + Android SDK 스택으로 사이드 프로젝트를 단독 구현했습니다. 실제 상용 앱(올리브영)을 타겟으로 단말 제어, 로그인 버튼 탐색·클릭, 계정 및 비밀번호 입력 플로우가 자동으로 수행되도록 구축해 모바일 UI 테스트 자동화의 기반을 직접 확인했습니다.',
          '입사 후에는 개발 구조에 대한 이해와 집요한 품질 검증 시각을 겸비한 구성원으로서 맡은 업무를 성실히 해내고, 동료들이 언제든 믿고 의지할 수 있는 팀원이 되겠습니다. 이 서재의 포트폴리오에 함께 담은 상용 iOS 앱(PosePik · Lumio), 219건의 QA 산출물 통합 뷰어, 그리고 테스트 자동화 시연 영상도 편히 살펴봐 주시면 감사하겠습니다.'
        ]
      }
    ]
  },

  // 제2초 [설계와 구현] : 상용 iOS 프로덕트 포트폴리오 데이터
  iosApps: [
    {
      id: 'posepik',
      analyticsName: 'PosePik',
      iconType: 'posepik',
      name: 'PosePik (포즈픽)',
      subtitle: 'AI 실시간 카메라 포즈 & 구도 가이드 앱',
      badges: ['App Store Live', 'iOS', '100% Free'],
      summary:
        '온디바이스 비전 AI로 카메라 프리뷰 속 인물 구도를 실시간 분석해 시각 오버레이와 청각 피드백으로 완벽한 촬영을 돕는 완전 무료 카메라 가이드 프로덕트입니다.',
      techTags: ['#Swift', '#VisionFramework', '#CoreML', '#AVFoundation', '#MultimodalUX'],
      highlights: [
        {
          label: '개발 아키텍처',
          title: '온디바이스 실시간 포즈 추론 및 멀티모달 피드백',
          desc: '네트워크 지연 없는 촬영 경험을 위해 Vision Framework·CoreML 기반 관절 추정 파이프라인을 구축하고, 가이드 실루엣 오버레이와 음성·효과음 피드백을 결합했습니다.'
        },
        {
          label: '실기기 검증 (QA)',
          title: '시뮬레이터 한계를 보완한 필드 카메라·실환경 검증',
          desc: '역광·저조도 오인식, 연속 촬영 발열 시 프레임 유지력, 야외 주변 소음 환경에서의 오디오 가이드 전달력 및 카메라 권한 예외 케이스를 실기기로 직접 검증했습니다.'
        },
        {
          label: '출시 및 운영 성과',
          title: "완전 무료 서비스 운영 및 '솔로 모드' 기능 확장",
          desc: "별도 비용 없이 누구나 사용할 수 있는 완전 무료 앱으로 기획·개발·출시·웹 호스팅(posepik.com)을 1인 체제로 운영 중이며, 사용자 촬영 패턴을 반영한 '솔로 모드(Solo Mode)' 업데이트로 활용 시나리오를 넓혔습니다."
        }
      ],
      landingUrl: 'https://posepik.com',
      landingLabel: '공식 웹사이트 (posepik.com)',
      appStoreUrl: '', // TODO: 실제 PosePik App Store URL 입력 시 버튼 자동 노출
      demoVideoUrl: 'https://youtu.be/VzHlFuM22Ro',
      demoVideoLabel: '포트폴리오 발표 영상 ▶',
      demoVideoTitle: 'PosePik (포즈픽) 포트폴리오 발표 영상'
    },
    {
      id: 'lumio',
      analyticsName: 'Lumio',
      iconType: 'lumio',
      name: 'Lumio (루미오)',
      subtitle: 'FSRS 알고리즘 & 온디바이스 OCR 기반 AI 플래시카드 앱',
      badges: ['iOS · watchOS', 'WidgetKit', 'AI EdTech'],
      summary:
        '교재 텍스트를 온디바이스 OCR로 추출해 카드를 자동 생성하고, 망각곡선 알고리즘으로 산출한 최적 복습 주기를 iPhone과 Apple Watch로 연결하는 스마트 학습 앱입니다.',
      techTags: ['#Swift', '#FSRS알고리즘', '#OnDeviceOCR', '#AppleWatch', '#WidgetKit'],
      highlights: [
        {
          label: '개발 아키텍처',
          title: 'FSRS 스케줄링 엔진 & 멀티 디바이스 생태계 설계',
          desc: 'FSRS 간격 반복 알고리즘으로 개인별 최적 복습 주기를 계산하고, 온디바이스 OCR 카드 생성부터 홈·잠금화면 위젯 및 watchOS 확장 타겟까지 유기적으로 연결했습니다.'
        },
        {
          label: '실기기 검증 (QA)',
          title: 'iPhone–Watch 동기화 정합성 및 실제 인쇄물 OCR 검증',
          desc: '실기기 페어링 환경에서 오프라인 전환 시 데이터 정합성과 위젯 메모리 제한을 검증하고, 책장 굴곡·조명 반사 등 실제 촬영 변수별 OCR 인식률을 테스트했습니다.'
        },
        {
          label: '출시 및 운영 성과',
          title: '기획·개발·QA·프로모션 1인 풀사이클 운영',
          desc: '프로덕트 구축부터 웹 랜딩(lumioapp.win) 운영, 학습자 타겟 마케팅까지 전 과정을 주도하며 자투리 시간을 활용하는 마이크로 러닝 UX를 고도화하고 있습니다.'
        }
      ],
      landingUrl: 'https://lumioapp.win',
      landingLabel: '공식 웹사이트 (lumioapp.win)',
      appStoreUrl: '', // TODO: 실제 Lumio App Store URL 입력 시 버튼 자동 노출
      demoVideoUrl: '' // TODO: 시연 유튜브 링크 입력 시 라이트박스 재생 버튼 자동 노출
    }
  ],

  featuredVideo: {
    badge: 'FEATURED PRESENTATION',
    title: 'PosePik (포즈픽) — AI 실시간 카메라 포즈 가이드 포트폴리오 발표 영상',
    duration: '12:26',
    youtubeUrl: 'https://youtu.be/VzHlFuM22Ro',
    summaryLines: [
      {
        label: '발표 개요',
        text: '연애 포기와 저출산 문제에 도움이 되기 위해 기획되었으며, 커플 모드에 랜덤 포즈 뽑기·타임어택 모드 등 게이미피케이션을 접목한 완전 무료 AI 카메라 가이드 앱 PosePik의 핵심 기능 시연과 개발·검증 전 과정을 담은 포트폴리오 발표 영상입니다.'
      },
      {
        label: '핵심 기술',
        text: 'Swift · Vision Framework · CoreML · AVFoundation 기반 온디바이스 실시간 관절 추론, 가이드 실루엣 오버레이 및 오디오 멀티모달 피드백 설계.'
      },
      {
        label: '실기기 QA · 기여도',
        text: '역광·저조도·연속 촬영 발열·야외 오디오 전달력 등 필드 실기기 검증, 추후에 추가된 솔로 모드 확장, 공식 웹(posepik.com) 구축 및 발표까지 100% 1인 수행.'
      }
    ]
  },

  qaPortfolio: {
    badge: 'LEAD QA & FULL-STACK AI PROJECT',
    title: '구마야 산책가자 — AI 기반 반려견 어시스턴트 앱 (주도적 QA & 개발)',
    subtitle:
      '팀 내 QA를 주도적으로 리드해 219개 테스트케이스·결함 추적·결과 보고서(3개 시트)를 완성하고, LLM 챗봇 RAG와 위치·지도 기능을 직접 구현한 프로젝트입니다.',
    metrics: [
      { label: '설계 · 수행 TC', value: '219개 TC (3개 시트)' },
      { label: '품질 달성 지표', value: 'PASS 87.7% → 93.2%' },
      { label: '이준영 담당 영역', value: '주도적 QA · LLM RAG · 지도 FE' }
    ],
    gumaProject: {
      badge: 'AI 반려견 어시스턴트 · 결과물 시연',
      demoTitle: '구마야 산책가자 — 결과물 시연 영상 (iPhone 고화질)',
      demoDuration: '01:37',
      demoVideoUrl: 'https://youtube.com/shorts/rf11zyeDSRM',
      demoDesc:
        '반려견 산책로 추천·플레이스 지도 탐색·LLM 챗봇 상담 등 실제 구현된 iOS 앱 결과물 동작과 사용자 플로우를 담은 시연 영상입니다.',
      myRoles: [
        {
          badge: 'QA LEAD (주도적 수행)',
          title: '219개 테스트케이스 설계 · 결함 리포팅 · 품질 결과 보고서 작성',
          desc: '프로젝트 QA를 주도하며 회원가입·챗봇·플레이스 지도·산책 통계 전 구간 219개 TC를 설계·수행하고, 27건의 결함 식별 및 보완 검증(PASS율 87.7% → 93.2%)을 총괄해 최종 테스트 결과 보고서를 작성했습니다.'
        },
        {
          badge: 'BACK-END · AI',
          title: 'LLM 챗봇 RAG 구현 및 데이터 학습',
          desc: '반려견 산책·케어 맞춤형 응답을 생성하는 LLM 기반 챗봇 RAG(검색 증강 생성) 파이프라인을 구축하고 도메인 데이터를 학습·연동했습니다.'
        },
        {
          badge: 'FRONT-END · MAP',
          title: '현재 위치 세션 연동 · 플레이스 지도 & 마커 클러스터링 구현',
          desc: '사용자의 현재 위치 정보 세션 연동과 반려견 동반 플레이스 지도 UI를 개발하고, 다수 장소 마커 가독성을 높이는 마커 클러스터링을 구현했습니다.'
        }
      ]
    },
    summaryDetails: [
      'QA 산출물 3개 시트(테스터케이스 219건 · 결함리스트 27건 · 테스트 결과 보고서) 단독 설계 및 작성 완료 — 우측 상단 뷰어 버튼으로 웹페이지 내 즉시 열람 가능',
      '1차 QA에서 총 219 TC 중 192 Pass / 27 Fail(87.7%) 및 Major 3·Minor 6·Trivial 18 결함을 도출하고, 수정 반영·재검증을 거쳐 PASS율 93.2%(204 Pass)까지 품질 개선',
      'FastAPI + Appium + Android SDK 스택으로 Android 스마트폰 로그인 및 입력 플로우 UI 테스트 자동화 시연 프로젝트 단독 구현',
      '신용데이터 파견사 서버 CPU/RAM 점유율 상시 모니터링(QC) 및 일간·주간·2주·월간 리소스 데이터 추출·정량 보고 수행',
      '자체 출시·운영 중인 iOS 앱(PosePik · Lumio) 멀티 디바이스 실기기 카메라, 온디바이스 OCR, WidgetKit 및 Apple Watch 연동 회귀 검증 수행'
    ],
    // TODO: 추가 구글 드라이브 공유 링크가 있다면 입력 시 버튼이 자동으로 노출됩니다.
    driveUrl: '',
    automationDemo: {
      badge: 'SIDE PROJECT · MOBILE TEST AUTOMATION',
      title: 'Android 스마트폰 테스트 자동화 시연 영상',
      duration: '00:22',
      youtubeUrl: 'https://youtube.com/shorts/ZwqMxGX4Viw',
      techTags: ['#Appium', '#FastAPI', '#Android', '#Python', '#UITestAutomation'],
      description:
        'FastAPI 서버와 Appium을 연동해 Android 스마트폰에서 앱 제어, 로그인 버튼 탐색·클릭, 계정/비밀번호 입력 등 모바일 테스트 시나리오를 자동으로 수행하는 사이드 프로젝트 시연 영상입니다.'
    }
  },

  youtubeChannel: {
    badge: 'YOUTUBE CHANNEL · @younghwen',
    name: 'Pio-Jun0 (@younghwen)',
    description:
      '“함께 새로운 음악의 세계를 탐험해봐요!” — 직접 제작한 오리지널 창작 음원(The Art of Interpretation, Phoenix)부터 영화 명장면과 OST의 깊은 맥락을 전하는 번역·자막 콘텐츠(록키 발보아 - 아버지의 현실 조언, 매트릭스 Navras 산스크리트어 해석, 이프 온리, 쿵푸팬더 3 등), 그리고 자체 출시 앱(Lumio · PosePik) 홍보 쇼츠와 프로젝트 시연까지 음악적 감성과 영상 스토리텔링 감각을 함께 아카이빙하는 크리에이터 채널입니다.',
    direction:
      '채널 구성: 오리지널 창작 사운드트랙 · 영화 명장면 & OST 번역·자막 디자인 · AI 앱 프로모션 쇼츠 & 개발 시연 아카이브',
    channelUrl: 'https://www.youtube.com/@younghwen'
  },

  videoArchive: [
    {
      id: 'ost-navras',
      title: '[매트릭스 OST] Juno Reactor - Navras 한글자막(산스크리트어,힌디어)',
      duration: '09:06',
      tags: ['#매트릭스OST', '#한글자막', '#산스크리트어번역'],
      goal: '영화 《매트릭스: 레볼루션》 엔딩곡의 산스크리트어·힌디어 고대 만트라(우파니샤드) 가사를 한국어로 번역·해석하고 극적 흐름에 맞춰 자막을 연출한 대표 영상입니다.',
      youtubeUrl: 'https://www.youtube.com/watch?v=O7o2XS47gyk'
    },
    {
      id: 'music-interpretation',
      title: '창작곡 — The Art of Interpretation',
      duration: '04:37',
      tags: ['#창작곡', '#OriginalTrack', '#사운드메이킹'],
      goal: '섬세한 선율과 입체적인 사운드 레이어링으로 해석의 여운과 서사적 분위기를 담아낸 오리지널 창작 음원입니다.',
      youtubeUrl: 'https://www.youtube.com/watch?v=U3zkgEMsdIU'
    },
    {
      id: 'cinema-rocky-balboa',
      title: '록키 발보아 - 아버지의 현실 조언',
      duration: '04:19',
      tags: ['#록키발보아', '#명장면자막', '#영화리뷰'],
      goal: '영화 《록키 발보아(2006)》 속 부자(父子)의 길거리 대화 명장면에 담긴 감정선과 핵심 메시지를 몰입감 있는 한국어 자막으로 전달한 대표 영상입니다.',
      youtubeUrl: 'https://youtu.be/CfM4azGSMkA'
    }
  ]
};
