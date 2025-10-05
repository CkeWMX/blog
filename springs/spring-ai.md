---
outline: deep
---

## 1. 简介

> Spring AI 项目旨在简化开发集成人工智能功能的应用程序，避免不必要的复杂性。
> <br>
> 该项目借鉴了著名的 Python 项目，如 LangChain 和 LlamaIndex，但 Spring AI 并不是这些项目的直接移植。<br>该项目的创立基于一个信念：下一波生成式 AI 应用将不仅限于 Python 开发者，而是会普及到许多编程语言中。
> <br> > [简介摘自官网](https://docs.spring.io/spring-ai/reference/index.html) > <br>
> 本文将按照[官方教程](https://docs.spring.io/spring-ai/reference/)进行阐述。

## 2. Chat Client

> ChatClient 提供了一个用于与 AI 模型通信的流畅 API。它支持同步和流式编程模型。

### 2.1. 构建聊天客户端

通过构造方法：

```java
private final ChatClient chatClient;
public SomeFunc(ChatClient.Builder chatClientBuilder) {
    this.chatClient = chatClientBuilder.build();
}
```

通过注解：

```java
@Resource
private ChatClient.Builder builder;
// 方法内
ChatClient chatClient = builder.build();

```

### 2.2. 构建多聊天模型

> 当单模型无法处理我们的业务时，我们常常需要构建多个模型。如：为不同的的任务分配不同的模型...

> 我们需要设置`spring.ai.chat.client.enabled=false`来禁用 Spring AI 自动配置的`ChatClient.Builder` Bean。<br>下面的例子将演示构建 OpenAI 与 DeepSeek 模型

#### 2.2.1. 引入依赖

```xml
 <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-deepseek</artifactId>
</dependency>
```
> 更多模型[访问官网](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)

#### 2.2.2. 配置

```yaml
spring:
  application:
    name: SpringAITest
  ai:
    chat:
      client:
        enabled: false
    openai:
      base-url: https://xxx.com
      api-key: sk-******
    deepseek:
      api-key: sk-******
      base-url: https://xxx.com/v1
      chat:
        options:
          model: deepseek-r1
```

#### 2.2.3. 示例
笔者新建了一个简单的Get接口，该接口需要传递一个tag参数，当其值为`oai`时将使用OpenAI提供的模型，否则将使用DeepSeek提供的模型。<br>
COnfig:

```java
@Configuration
public class ChatModalConfig {
    @Bean
    public ChatClient openAiChatClient(OpenAiChatModel openAiChatModel){
        return ChatClient.create(openAiChatModel);
    }
    @Bean
    public ChatClient deepSeekAiChatClient(DeepSeekChatModel deepSeekChatModel){
        return ChatClient.create(deepSeekChatModel);
    }
}

```

Controller:

```java
@GetMapping("/multi-modal")
public void BuildMultiModal(@RequestParam String tag) {
    chatClientService.buildMultiModal(tag);
}
```

Service:

```java
@Resource(name = "deepSeekAiChatClient")
private ChatClient deepSeekChatClient;

@Resource(name = "openAiChatClient")
private ChatClient openAiChatClient;

@Override
public void buildMultiModal(String tag) {
    ChatClient client;
    if (tag.equals("oai")) {
        client = openAiChatClient;
    } else {
        client = deepSeekChatClient;
    }
    String content = client.prompt().user("你是什么模型").call().content();
    log.info(content);
}
```

访问/multi-modal?tag=oai时：
> 我是一个基于GPT-3模型的人工智能助手，旨在提供信息和回答问题。如果你有任何问题或需要帮助，随时可以问我！

访问/multi-modal?tag=ds时：
> 你好！我是DeepSeek，由深度求索公司创造的AI助手。我是DeepSeek最新版本的模型，专门为帮助用户解答问题、提供信息和协助完成任务而设计。


