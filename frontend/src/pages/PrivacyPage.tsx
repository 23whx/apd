import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PrivacyPage: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {i18n.language === 'zh' ? '返回首页' : i18n.language === 'ja' ? 'ホームに戻る' : 'Back to Home'}
      </Link>

      <div className="bg-eva-surface border border-white/10 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-eva-secondary" />
          <h1 className="text-4xl font-bold">
            {i18n.language === 'zh' ? '隐私政策' : i18n.language === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy'}
          </h1>
        </div>

        <p className="text-gray-400 mb-6">
          {i18n.language === 'zh' ? '最后更新：2025年12月' : i18n.language === 'ja' ? '最終更新: 2025年12月' : 'Last Updated: December 2025'}
        </p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '1. 我们收集的信息' : i18n.language === 'ja' ? '1. 収集する情報' : '1. Information We Collect'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh' 
                ? 'APD（ACGN Personality Database）致力于保护您的隐私。我们收集以下类型的信息：'
                : i18n.language === 'ja'
                ? 'APD（ACGN Personality Database）はあなたのプライバシーを保護することに努めています。以下の種類の情報を収集します：'
                : 'APD (ACGN Personality Database) is committed to protecting your privacy. We collect the following types of information:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '账户信息：电子邮件地址、用户名、显示名称' : i18n.language === 'ja' ? 'アカウント情報：メールアドレス、ユーザー名、表示名' : 'Account Information: Email address, username, display name'}</li>
              <li>{i18n.language === 'zh' ? '用户内容：提交的作品、角色信息、投票记录、评论' : i18n.language === 'ja' ? 'ユーザーコンテンツ：提出された作品、キャラクター情報、投票記録、コメント' : 'User Content: Submitted works, character information, votes, comments'}</li>
              <li>{i18n.language === 'zh' ? '使用数据：访问日志、互动记录（仅用于改进服务）' : i18n.language === 'ja' ? '使用データ：アクセスログ、インタラクション記録（サービス改善のみに使用）' : 'Usage Data: Access logs, interaction records (used only to improve service)'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '2. 信息使用方式' : i18n.language === 'ja' ? '2. 情報の使用方法' : '2. How We Use Information'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? '您的信息将用于以下目的：'
                : i18n.language === 'ja'
                ? 'あなたの情報は以下の目的で使用されます：'
                : 'Your information is used for the following purposes:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '提供和维护核心服务功能' : i18n.language === 'ja' ? 'コアサービス機能の提供と維持' : 'Providing and maintaining core service features'}</li>
              <li>{i18n.language === 'zh' ? '个性化用户体验' : i18n.language === 'ja' ? 'ユーザー体験のパーソナライゼーション' : 'Personalizing user experience'}</li>
              <li>{i18n.language === 'zh' ? '改进网站性能和安全性' : i18n.language === 'ja' ? 'ウェブサイトのパフォーマンスとセキュリティの改善' : 'Improving website performance and security'}</li>
              <li>{i18n.language === 'zh' ? '与您沟通重要的服务更新' : i18n.language === 'ja' ? '重要なサービス更新についての連絡' : 'Communicating important service updates'}</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              {i18n.language === 'zh'
                ? '我们绝不会将您的个人信息出售给第三方。'
                : i18n.language === 'ja'
                ? 'お客様の個人情報を第三者に販売することは決してありません。'
                : 'We will never sell your personal information to third parties.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '3. 数据安全' : i18n.language === 'ja' ? '3. データセキュリティ' : '3. Data Security'}
            </h2>
            <p>
              {i18n.language === 'zh'
                ? 'APD 使用 Supabase 作为数据存储服务，采用行级安全策略（RLS）确保用户数据安全。我们采用业界标准的加密和安全措施保护您的信息。然而，请注意，没有任何互联网传输方法或电子存储方法是100%安全的。'
                : i18n.language === 'ja'
                ? 'APDはSupabaseをデータストレージサービスとして使用し、行レベルセキュリティ（RLS）を採用してユーザーデータの安全性を確保しています。業界標準の暗号化とセキュリティ対策を使用して情報を保護しています。ただし、インターネット送信方法や電子ストレージ方法は100%安全ではないことにご注意ください。'
                : 'APD uses Supabase as its data storage service with Row Level Security (RLS) policies to ensure user data safety. We use industry-standard encryption and security measures to protect your information. However, please note that no method of transmission over the Internet or electronic storage is 100% secure.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '4. 您的权利' : i18n.language === 'ja' ? '4. あなたの権利' : '4. Your Rights'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? '您对自己的数据拥有以下权利：'
                : i18n.language === 'ja'
                ? 'あなたは自分のデータに対して以下の権利を持っています：'
                : 'You have the following rights regarding your data:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '访问和导出您的个人数据' : i18n.language === 'ja' ? '個人データへのアクセスとエクスポート' : 'Access and export your personal data'}</li>
              <li>{i18n.language === 'zh' ? '更正不准确的信息' : i18n.language === 'ja' ? '不正確な情報の修正' : 'Correct inaccurate information'}</li>
              <li>{i18n.language === 'zh' ? '删除您的账户和相关数据' : i18n.language === 'ja' ? 'アカウントと関連データの削除' : 'Delete your account and associated data'}</li>
              <li>{i18n.language === 'zh' ? '撤回同意（在适用的情况下）' : i18n.language === 'ja' ? '同意の撤回（該当する場合）' : 'Withdraw consent (where applicable)'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '5. 联系我们' : i18n.language === 'ja' ? '5. お問い合わせ' : '5. Contact Us'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? '如果您对本隐私政策有任何疑问或需要行使您的权利，请联系我们：'
                : i18n.language === 'ja'
                ? 'このプライバシーポリシーについてご質問がある場合、または権利を行使する必要がある場合は、お問い合わせください：'
                : 'If you have any questions about this Privacy Policy or need to exercise your rights, please contact us:'}
            </p>
            <div className="bg-black/30 rounded-lg p-4 space-y-2">
              <p><strong>{i18n.language === 'zh' ? '作者：' : i18n.language === 'ja' ? '作者：' : 'Author:'}</strong> Rollkey ({i18n.language === 'zh' ? '小学生滚键式' : i18n.language === 'ja' ? '小学生滚键式' : 'Rollkey'})</p>
              <p><strong>{i18n.language === 'zh' ? '邮箱：' : i18n.language === 'ja' ? 'メール：' : 'Email:'}</strong> <a href="mailto:wanghongxiang23@gmail.com" className="text-eva-secondary hover:underline">wanghongxiang23@gmail.com</a></p>
              <p><strong>X (Twitter):</strong> <a href="https://x.com/Rollkey4" target="_blank" rel="noopener noreferrer" className="text-eva-secondary hover:underline">@Rollkey4</a></p>
              <p><strong>{i18n.language === 'zh' ? '工具导航站：' : i18n.language === 'ja' ? 'ツールナビゲーション：' : 'Tool Navigation:'}</strong> <a href="https://oumashu.top" target="_blank" rel="noopener noreferrer" className="text-eva-secondary hover:underline">oumashu.top</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '6. 政策更新' : i18n.language === 'ja' ? '6. ポリシーの更新' : '6. Policy Updates'}
            </h2>
            <p>
              {i18n.language === 'zh'
                ? '我们可能会不时更新本隐私政策。任何更改都将在此页面上发布，重大更改将通过电子邮件或网站通知告知用户。'
                : i18n.language === 'ja'
                ? 'このプライバシーポリシーは随時更新される場合があります。変更はこのページに掲載され、重要な変更についてはメールまたはウェブサイト通知でユーザーに通知されます。'
                : 'We may update this Privacy Policy from time to time. Any changes will be posted on this page, and significant changes will be communicated to users via email or website notification.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

