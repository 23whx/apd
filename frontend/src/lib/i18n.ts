import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        works: 'Works',
        characters: 'Characters',
        login: 'Login',
        logout: 'Logout',
        profile: 'Profile',
        submitWork: 'Submit Work'
      },
      hero: {
        status: 'System Online',
        title: 'ACGN Personality Database',
        subtitle: 'Decode the psyche of your favorite characters.',
        description: 'Submit works, analyze traits, and vote on MBTI, Enneagram, and more.',
        searchPlaceholder: 'Search anime, manga, games, or characters...',
        scanButton: 'SCAN'
      },
      stats: {
        characters: 'Characters',
        votes: 'Votes',
        works: 'Works',
        uptime: 'Uptime'
      },
      trending: {
        title: 'Trending Entries',
        viewAll: 'View All',
        charactersCount: 'Characters',
        votesCount: 'Votes'
      },
      workTypes: {
        anime: 'Anime',
        manga: 'Manga',
        game: 'Game',
        novel: 'Novel'
      },
      personality: {
        mbti: 'MBTI',
        enneagram: 'Enneagram',
        subtype: 'Subtype',
        yiHexagram: 'Yi Hexagram'
      },
      footer: {
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        about: 'About',
        api: 'API',
        copyright: '© 2025 APD Project. All data sources belong to their respective owners.'
      },
      profile: {
        title: 'Profile Settings',
        email: 'Email',
        username: 'Username',
        displayName: 'Display Name',
        chooseAvatar: 'Choose Avatar (Preset)',
        selectedAvatar: 'Selected Avatar',
        memberSince: 'Member Since',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        updateSuccess: 'Profile updated successfully!',
        myActivity: 'My Activity',
        worksSubmitted: 'Works Submitted',
        votesCast: 'Votes Cast',
        comments: 'Comments'
      }
    }
  },
  zh: {
    translation: {
      nav: {
        works: '作品',
        characters: '角色',
        login: '登录',
        logout: '退出',
        profile: '个人中心',
        submitWork: '提交作品'
      },
      hero: {
        status: '系统在线',
        title: 'ACGN 人格数据库',
        subtitle: '解析你最喜爱角色的心理特质',
        description: '提交作品、分析特质、投票 MBTI、九型人格等',
        searchPlaceholder: '搜索动漫、漫画、游戏或角色...',
        scanButton: '扫描'
      },
      stats: {
        characters: '角色',
        votes: '投票',
        works: '作品',
        uptime: '在线率'
      },
      trending: {
        title: '热门条目',
        viewAll: '查看全部',
        charactersCount: '个角色',
        votesCount: '次投票'
      },
      workTypes: {
        anime: '动画',
        manga: '漫画',
        game: '游戏',
        novel: '小说'
      },
      personality: {
        mbti: 'MBTI类型',
        enneagram: '九型人格',
        subtype: '副型',
        yiHexagram: '易学六十四卦'
      },
      footer: {
        privacy: '隐私政策',
        terms: '服务条款',
        about: '关于',
        api: 'API',
        copyright: '© 2025 APD 项目。所有数据源归其各自所有者所有。'
      },
      profile: {
        title: '个人设置',
        email: '邮箱',
        username: '用户名',
        displayName: '显示名称',
        chooseAvatar: '选择头像（预设）',
        selectedAvatar: '已选头像',
        memberSince: '注册时间',
        saveChanges: '保存更改',
        saving: '保存中...',
        updateSuccess: '个人资料更新成功！',
        myActivity: '我的活动',
        worksSubmitted: '提交的作品',
        votesCast: '投票次数',
        comments: '评论'
      }
    }
  },
  ja: {
    translation: {
      nav: {
        works: '作品',
        characters: 'キャラクター',
        login: 'ログイン',
        logout: 'ログアウト',
        profile: 'プロフィール',
        submitWork: '作品を投稿'
      },
      hero: {
        status: 'システムオンライン',
        title: 'ACGN パーソナリティデータベース',
        subtitle: 'お気に入りのキャラクターの心理を解析',
        description: '作品を投稿し、特性を分析し、MBTIやエニアグラムなどに投票',
        searchPlaceholder: 'アニメ、漫画、ゲーム、キャラクターを検索...',
        scanButton: 'スキャン'
      },
      stats: {
        characters: 'キャラクター',
        votes: '投票',
        works: '作品',
        uptime: '稼働率'
      },
      trending: {
        title: 'トレンド',
        viewAll: 'すべて表示',
        charactersCount: 'キャラクター',
        votesCount: '投票'
      },
      workTypes: {
        anime: 'アニメ',
        manga: '漫画',
        game: 'ゲーム',
        novel: '小説'
      },
      personality: {
        mbti: 'MBTIタイプ',
        enneagram: 'エニアグラム',
        subtype: 'サブタイプ',
        yiHexagram: '易学六十四卦'
      },
      footer: {
        privacy: 'プライバシーポリシー',
        terms: '利用規約',
        about: 'について',
        api: 'API',
        copyright: '© 2025 APD プロジェクト。すべてのデータソースはそれぞれの所有者に帰属します。'
      },
      profile: {
        title: 'プロフィール設定',
        email: 'メール',
        username: 'ユーザー名',
        displayName: '表示名',
        chooseAvatar: 'アバターを選択（プリセット）',
        selectedAvatar: '選択したアバター',
        memberSince: '登録日',
        saveChanges: '変更を保存',
        saving: '保存中...',
        updateSuccess: 'プロフィールが正常に更新されました！',
        myActivity: 'マイアクティビティ',
        worksSubmitted: '提出した作品',
        votesCast: '投票数',
        comments: 'コメント'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;

