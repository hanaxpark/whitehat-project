export const categories = [
  { id: 'general', name: '개발 일반', description: '코딩 팁 & 이슈', icon: 'code' },
  { id: 'frontend', name: '프론트엔드', description: 'React, Vue, Web', icon: 'layers' },
  { id: 'backend', name: '백엔드', description: 'API, Server, DB', icon: 'database' },
  { id: 'cloud', name: '인프라 / 클라우드', description: 'AWS, Docker, CI/CD', icon: 'cloud' },
  { id: 'security', name: '보안', description: '안전한 개발과 운영', icon: 'shield' },
  { id: 'study', name: '스터디', description: '함께 배우는 개발', icon: 'users' },
  { id: 'free', name: '자유 게시판', description: '개발자의 일상', icon: 'message' },
];
export const categoryName = id => categories.find(c => c.id === id)?.name || id;
