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
    // 워크스페이스 루트에 위치한 실제 파일명 (런타임에서 NFC 정규화 + encodeURI 적용)
    resumePdf: '이준영_고용24_이력서.pdf',
    coverLetterPdf: '이준영_고용24_자기소개서.pdf',
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
        detail: 'V커머스 영상편집·GTQ 1급 · 단·중편 시나리오 및 소설 집필'
      }
    ]
  },

  candlesMeta: [
    {
      id: 1,
      numeral: '제1초',
      title: '기록과 증명',
      subtitle: 'Profile & PDF',
      tooltip: '프로필 요약 · 올라운더 역량 · 이력서 & 자기소개서 PDF',
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
        period: '2025.07 ~ 2025.10',
        role: 'AI 반려견 어시스턴트("구마야 산책가자") 주도적 QA · LLM RAG · 지도 개발',
        org: 'NVIDIA AI Academy · 사이드 프로젝트',
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
      '한국표준협회 — [엔비디아] NVIDIA AI Academy 수료 (AI · 머신러닝 · 딥러닝, 2025.07 ~ 2025.10)',
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
        text: '연애 포기와 저출산 문제를 해결하기 위해 기획되었으며, 커플 모드에 랜덤 포즈 뽑기·타임어택 모드 등 게이미피케이션을 접목한 완전 무료 AI 카메라 가이드 앱 PosePik의 핵심 기능 시연과 개발·검증 전 과정을 담은 포트폴리오 발표 영상입니다.'
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
