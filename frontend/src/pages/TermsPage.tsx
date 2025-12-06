import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, UserCheck, Ban, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TermsPage: React.FC = () => {
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
          <FileText className="w-8 h-8 text-eva-secondary" />
          <h1 className="text-4xl font-bold">
            {i18n.language === 'zh' ? '服务条款' : i18n.language === 'ja' ? '利用規約' : 'Terms of Service'}
          </h1>
        </div>

        <p className="text-gray-400 mb-6">
          {i18n.language === 'zh' ? '最后更新：2025年12月' : i18n.language === 'ja' ? '最終更新: 2025年12月' : 'Last Updated: December 2025'}
        </p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '1. 服务简介' : i18n.language === 'ja' ? '1. サービス概要' : '1. Service Overview'}
            </h2>
            <p>
              {i18n.language === 'zh'
                ? 'APD（ACGN Personality Database）是一个社区驱动的平台，致力于收集、分析和分享动漫（Anime）、漫画（Comics）、游戏（Games）和小说（Novels）角色的人格类型信息，包括MBTI、九型人格、副型和易学人格分析。'
                : i18n.language === 'ja'
                ? 'APD（ACGN Personality Database）は、アニメ、コミック、ゲーム、小説のキャラクターの性格タイプ情報（MBTI、エニアグラム、サブタイプ、易学性格分析を含む）を収集、分析、共有することに特化したコミュニティ主導のプラットフォームです。'
                : 'APD (ACGN Personality Database) is a community-driven platform dedicated to collecting, analyzing, and sharing personality type information for Anime, Comics, Games, and Novels characters, including MBTI, Enneagram, Subtypes, and I Ching personality analysis.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '2. 用户责任' : i18n.language === 'ja' ? '2. ユーザーの責任' : '2. User Responsibilities'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? '使用APD服务，您同意：'
                : i18n.language === 'ja'
                ? 'APDサービスを使用することにより、あなたは以下に同意します：'
                : 'By using APD services, you agree to:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '提供准确、真实的账户信息' : i18n.language === 'ja' ? '正確で真実のアカウント情報を提供する' : 'Provide accurate and truthful account information'}</li>
              <li>{i18n.language === 'zh' ? '对您的账户安全负责，不与他人共享账户' : i18n.language === 'ja' ? 'アカウントのセキュリティに責任を持ち、他人とアカウントを共有しない' : 'Be responsible for your account security and not share your account with others'}</li>
              <li>{i18n.language === 'zh' ? '尊重其他用户和社区规范' : i18n.language === 'ja' ? '他のユーザーとコミュニティ規範を尊重する' : 'Respect other users and community norms'}</li>
              <li>{i18n.language === 'zh' ? '提交的内容必须是原创的或已获得适当授权' : i18n.language === 'ja' ? '提出されたコンテンツはオリジナルまたは適切な許可を得たものでなければならない' : 'Submitted content must be original or properly authorized'}</li>
              <li>{i18n.language === 'zh' ? '不上传违法、有害、骚扰性或侵犯他人权利的内容' : i18n.language === 'ja' ? '違法、有害、嫌がらせ、または他人の権利を侵害するコンテンツをアップロードしない' : 'Not upload illegal, harmful, harassing, or rights-infringing content'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Ban className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '3. 禁止行为' : i18n.language === 'ja' ? '3. 禁止行為' : '3. Prohibited Conduct'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? '以下行为是严格禁止的：'
                : i18n.language === 'ja'
                ? '以下の行為は厳禁です：'
                : 'The following conduct is strictly prohibited:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '使用自动化工具（如机器人）进行刷票或垃圾信息发送' : i18n.language === 'ja' ? '自動化ツール（ボットなど）を使用した投票操作やスパム送信' : 'Using automated tools (such as bots) for vote manipulation or spam'}</li>
              <li>{i18n.language === 'zh' ? '骚扰、威胁或诽谤其他用户' : i18n.language === 'ja' ? '他のユーザーへの嫌がらせ、脅迫、または名誉毀損' : 'Harassing, threatening, or defaming other users'}</li>
              <li>{i18n.language === 'zh' ? '侵犯版权、商标或其他知识产权' : i18n.language === 'ja' ? '著作権、商標、またはその他の知的財産権の侵害' : 'Infringing copyrights, trademarks, or other intellectual property'}</li>
              <li>{i18n.language === 'zh' ? '尝试未经授权访问系统或其他用户账户' : i18n.language === 'ja' ? 'システムまたは他のユーザーアカウントへの不正アクセスの試み' : 'Attempting unauthorized access to systems or other user accounts'}</li>
              <li>{i18n.language === 'zh' ? '发布色情、暴力或仇恨言论内容' : i18n.language === 'ja' ? 'ポルノ、暴力、またはヘイトスピーチコンテンツの投稿' : 'Posting pornographic, violent, or hate speech content'}</li>
              <li>{i18n.language === 'zh' ? '创建多个账户进行投票操纵' : i18n.language === 'ja' ? '投票操作のために複数のアカウントを作成する' : 'Creating multiple accounts for vote manipulation'}</li>
            </ul>
            <p className="mt-3 text-sm text-yellow-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>
                {i18n.language === 'zh'
                  ? '违反这些条款可能导致账户暂停或永久封禁。'
                  : i18n.language === 'ja'
                  ? 'これらの規約に違反すると、アカウントの停止または永久禁止につながる可能性があります。'
                  : 'Violation of these terms may result in account suspension or permanent ban.'}
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '4. 内容所有权' : i18n.language === 'ja' ? '4. コンテンツの所有権' : '4. Content Ownership'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? '关于您提交的内容：'
                : i18n.language === 'ja'
                ? '提出されたコンテンツについて：'
                : 'Regarding content you submit:'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '您保留对自己创作内容的所有权' : i18n.language === 'ja' ? 'あなたは自分の作成したコンテンツの所有権を保持します' : 'You retain ownership of content you create'}</li>
              <li>{i18n.language === 'zh' ? '您授予APD非独家、全球性、免版税的许可，用于展示、分发和改进服务' : i18n.language === 'ja' ? 'APDに非独占的、世界的、ロイヤリティフリーのライセンスを付与し、コンテンツを表示、配布、サービスを改善します' : 'You grant APD a non-exclusive, worldwide, royalty-free license to display, distribute, and improve the service'}</li>
              <li>{i18n.language === 'zh' ? '社区投票和分析结果属于集体贡献，任何人都可以查看和引用' : i18n.language === 'ja' ? 'コミュニティの投票と分析結果は集団的な貢献であり、誰でも閲覧および引用できます' : 'Community voting and analysis results are collective contributions that anyone can view and reference'}</li>
              <li>{i18n.language === 'zh' ? '您可以随时删除自己提交的内容（投票记录除外）' : i18n.language === 'ja' ? 'いつでも自分が提出したコンテンツを削除できます（投票記録を除く）' : 'You may delete your submitted content at any time (except vote records)'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-eva-accent" />
              {i18n.language === 'zh' ? '5. 免责声明' : i18n.language === 'ja' ? '5. 免責事項' : '5. Disclaimer'}
            </h2>
            <p className="mb-3">
              {i18n.language === 'zh'
                ? 'APD 服务按"原样"提供：'
                : i18n.language === 'ja'
                ? 'APDサービスは「現状のまま」提供されます：'
                : 'APD service is provided "as is":'}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{i18n.language === 'zh' ? '人格分析结果仅供娱乐和参考，不构成专业心理学建议' : i18n.language === 'ja' ? '性格分析結果はエンターテインメントと参考用であり、専門的な心理学的アドバイスではありません' : 'Personality analysis results are for entertainment and reference only, not professional psychological advice'}</li>
              <li>{i18n.language === 'zh' ? '我们不保证服务的持续可用性、准确性或完整性' : i18n.language === 'ja' ? 'サービスの継続的な可用性、正確性、完全性を保証しません' : 'We do not guarantee continuous availability, accuracy, or completeness of the service'}</li>
              <li>{i18n.language === 'zh' ? '用户自行承担使用服务的风险' : i18n.language === 'ja' ? 'ユーザーは自己の責任でサービスを使用します' : 'Users use the service at their own risk'}</li>
              <li>{i18n.language === 'zh' ? 'APD 不对第三方链接内容负责' : i18n.language === 'ja' ? 'APDは第三者のリンクコンテンツに責任を負いません' : 'APD is not responsible for third-party linked content'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '6. 服务变更与终止' : i18n.language === 'ja' ? '6. サービスの変更と終了' : '6. Service Changes and Termination'}
            </h2>
            <p>
              {i18n.language === 'zh'
                ? 'APD 保留随时修改、暂停或终止服务的权利，恕不另行通知。我们将尽力提前通知重大变更，但不承担因服务变更或中断造成的任何损失责任。'
                : i18n.language === 'ja'
                ? 'APDは、事前通知なしにいつでもサービスを変更、一時停止、または終了する権利を留保します。重大な変更については事前にお知らせするよう努めますが、サービスの変更や中断による損失については責任を負いません。'
                : 'APD reserves the right to modify, suspend, or terminate the service at any time without prior notice. We will make efforts to notify users of significant changes in advance, but we are not liable for any losses caused by service changes or interruptions.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '7. 争议解决' : i18n.language === 'ja' ? '7. 紛争解決' : '7. Dispute Resolution'}
            </h2>
            <p>
              {i18n.language === 'zh'
                ? '如果您对服务有任何争议或投诉，请先通过以下联系方式与我们沟通。我们致力于友好协商解决所有问题。'
                : i18n.language === 'ja'
                ? 'サービスに関して紛争や苦情がある場合は、まず以下の連絡先を通じてご連絡ください。すべての問題を友好的な協議により解決することに努めます。'
                : 'If you have any disputes or complaints about the service, please first contact us through the following information. We are committed to resolving all issues through friendly negotiation.'}
            </p>
            <div className="bg-black/30 rounded-lg p-4 mt-3 space-y-2">
              <p><strong>{i18n.language === 'zh' ? '作者：' : i18n.language === 'ja' ? '作者：' : 'Author:'}</strong> Rollkey ({i18n.language === 'zh' ? '小学生滚键式' : i18n.language === 'ja' ? '小学生滚键式' : 'Rollkey'})</p>
              <p><strong>{i18n.language === 'zh' ? '邮箱：' : i18n.language === 'ja' ? 'メール：' : 'Email:'}</strong> <a href="mailto:wanghongxiang23@gmail.com" className="text-eva-secondary hover:underline">wanghongxiang23@gmail.com</a></p>
              <p><strong>X (Twitter):</strong> <a href="https://x.com/Rollkey4" target="_blank" rel="noopener noreferrer" className="text-eva-secondary hover:underline">@Rollkey4</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">
              {i18n.language === 'zh' ? '8. 条款修订' : i18n.language === 'ja' ? '8. 規約の改訂' : '8. Terms Revision'}
            </h2>
            <p>
              {i18n.language === 'zh'
                ? '我们可能会不定期更新这些服务条款。继续使用服务即表示您接受更新后的条款。重大变更将通过网站公告或电子邮件通知用户。'
                : i18n.language === 'ja'
                ? 'これらの利用規約は定期的に更新される場合があります。サービスの継続使用は、更新された規約への同意を意味します。重大な変更についてはウェブサイトの告知またはメールでユーザーに通知されます。'
                : 'We may update these Terms of Service from time to time. Continued use of the service constitutes acceptance of the updated terms. Significant changes will be communicated to users through website announcements or email.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

