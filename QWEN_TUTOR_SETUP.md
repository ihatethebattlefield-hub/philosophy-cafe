# 英文哲学导师：通义千问部署说明

网站中的导师界面已经完成。要让它真正回答问题，需要完成以下一次性设置。

## 1. 开通阿里云百炼并创建 API Key

1. 登录[阿里云百炼控制台](https://bailian.console.aliyun.com/)。
2. 地域选择 **华北 2（北京）**。
3. 开通模型服务，进入 **API Key** 页面。
4. 创建按量付费 API Key，立即复制并安全保存。新版密钥通常以 `sk-ws-` 开头，关闭弹窗后不能再次查看完整明文。
5. 在业务空间详情中复制该空间显示的 **API Host**。推荐使用业务空间专属地址，格式类似：
   `https://你的WorkspaceId.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

不要把 API Key 写进 HTML、JavaScript、GitHub 或聊天消息。

## 2. 建立每日使用限制

1. 打开 Supabase Dashboard 中 Philosophy Café 项目。
2. 进入 **SQL Editor**。
3. 打开并复制 `supabase-ai-tutor.sql` 的全部内容。
4. 运行 SQL。它会建立一个只有后台服务可以访问的每日计数表。

## 3. 设置 Supabase Edge Function 密钥

在 Supabase Dashboard 进入 **Edge Functions → Secrets**，添加：

| 名称 | 内容 |
|---|---|
| `DASHSCOPE_API_KEY` | 第 1 步创建的百炼 API Key |
| `QWEN_BASE_URL` | 第 1 步复制的 API Host，不要在结尾加 `/` |
| `QWEN_MODEL` | `qwen-plus` |
| `ALLOWED_ORIGINS` | `https://ihatethebattlefield-hub.github.io,http://localhost:8765,http://127.0.0.1:8765` |
| `TUTOR_DAILY_LIMIT` | `20` |
| `TUTOR_GLOBAL_DAILY_LIMIT` | `300` |

如果以后使用自己的域名，把它加入 `ALLOWED_ORIGINS`，多个网址之间用英文逗号分隔。

## 4. 部署 Edge Function

安装并登录 Supabase CLI 后，在本项目文件夹运行：

```bash
supabase link --project-ref ljaqfubozhgzwngtbdit
supabase functions deploy philosophy-tutor
```

Supabase 默认验证调用者的匿名 JWT；网站已经使用 Supabase 客户端，因此不需要把任何额外秘密交给浏览器。

## 5. 测试

1. 打开网站任意页面。
2. 点击右下角 **Ask the Guide / 英文哲学导师**。
3. 选择英语水平。
4. 点击一个建议问题或自己输入问题。

如果看到“导师暂时无法回答”，在 Supabase Dashboard 的 **Edge Functions → philosophy-tutor → Logs** 查看原因。最常见的问题是 API Key、API Host 或 SQL 使用限制函数尚未配置。

## 费用保护

- 每位访客默认每天最多提问 20 次。
- 全站默认每天最多调用 300 次。
- 每次问题最多 1,000 字符，只保留最近 12 条消息，每次回答最多约 900 tokens。
- 建议同时在阿里云百炼控制台设置费用提醒或预算上限。
