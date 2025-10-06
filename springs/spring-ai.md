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

#### 2.2.3. 示例-不同模型类型Chat Client
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


#### 2.2.4. 兼容多个API，以OpenAI为例

```java
// 此处代码来自官方文档
@Service
public class MultiModelService {
    private static final Logger logger = LoggerFactory.getLogger(MultiModelService.class);
    @Autowired
    private OpenAiChatModel baseChatModel;
    @Autowired
    private OpenAiApi baseOpenAiApi;
    public void multiClientFlow() {
        try {
            // Derive a new OpenAiApi for Groq (Llama3)
            OpenAiApi groqApi = baseOpenAiApi.mutate()
                .baseUrl("https://api.groq.com/openai")
                .apiKey(System.getenv("GROQ_API_KEY"))
                .build();
            // Derive a new OpenAiApi for OpenAI GPT-4
            OpenAiApi gpt4Api = baseOpenAiApi.mutate()
                .baseUrl("https://api.openai.com")
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .build();
            // Derive a new OpenAiChatModel for Groq
            OpenAiChatModel groqModel = baseChatModel.mutate()
                .openAiApi(groqApi)
                .defaultOptions(OpenAiChatOptions.builder().model("llama3-70b-8192").temperature(0.5).build())
                .build();
            // Derive a new OpenAiChatModel for GPT-4
            OpenAiChatModel gpt4Model = baseChatModel.mutate()
                .openAiApi(gpt4Api)
                .defaultOptions(OpenAiChatOptions.builder().model("gpt-4").temperature(0.7).build())
                .build();
            // Simple prompt for both models
            String prompt = "What is the capital of France?";
            String groqResponse = ChatClient.builder(groqModel).build().prompt(prompt).call().content();
            String gpt4Response = ChatClient.builder(gpt4Model).build().prompt(prompt).call().content();
            logger.info("Groq (Llama3) response: {}", groqResponse);
            logger.info("OpenAI GPT-4 response: {}", gpt4Response);
        }
        catch (Exception e) {
            logger.error("Error in multi-client flow", e);
        }
    }
}
```

### 2.3. 响应
#### 2.3.1. ChatResponse

```java

@Resource(name = "openAiChatClient")
private ChatClient openAiChatClient;

@GetMapping("/chat-response")
public void testChatResponse(){
  ChatResponse chatResponse = openAiChatClient.prompt().user(userInput).call().chatResponse();
  assert chatResponse != null;
  log.info(chatResponse.toString());
}

```

```text
 ChatResponse [metadata={ id: chatcmpl-CNVtH5uGPCEHi7pwdMdXgW7FLHf6w, usage: DefaultUsage{promptTokens=10, completionTokens=32, totalTokens=42}, rateLimit: { @type: org.springframework.ai.openai.metadata.OpenAiRateLimit, requestsLimit: 200, requestsRemaining: 199, requestsReset: PT7M12S, tokensLimit: 100000; tokensRemaining: 99993; tokensReset: PT3M44S } }, generations=[Generation[assistantMessage=AssistantMessage [messageType=ASSISTANT, toolCalls=[], textContent=我是一个基于人工智能的语言模型，旨在理解和生成自然语言文本。如果你有任何问题或者需要帮助，可以随时问我！, metadata={role=ASSISTANT, messageType=ASSISTANT, finishReason=STOP, refusal=, index=0, annotations=[], id=chatcmpl-CNVtH5uGPCEHi7pwdMdXgW7FLHf6w}], chatGenerationMetadata=DefaultChatGenerationMetadata[finishReason='STOP', filters=0, metadata=0]]]]

```

#### 2.3.2. 返回实体对象

```java

record Films(String type, List<String> movies) {}

@GetMapping("/entity")
public void getEntity(){
    Films films = openAiChatClient.prompt().user("给出我科幻电影类型的电影列表").call().entity(Films.class);
    assert films != null;
    log.info(films.toString());
}
```

```text
Films[type=科幻电影, movies=[星际穿越, 盗梦空间, 银翼杀手2049, 2001太空漫游, 黑客帝国, 异形, 终结者2：审判日, 火星救援, 人工智能, 超体]]
```

另一个重载的entity方法`entity(ParameterizedTypeReference<T> type)`，允许指定泛型，如泛型列表等：

```java
@GetMapping("/entity-list")
public void getEntityList(){
    List<Films> entity = openAiChatClient.prompt().user("给出我3个不同类型的电影列表，每种电影类型给出我三部电影。").call().entity(new ParameterizedTypeReference<List<Films>>() {
    });
    assert entity != null;
    log.info(entity.toString());
}
```

```text
[Films[type=动作, movies=[速度与激情, 复仇者联盟, 约翰·威克]], Films[type=爱情, movies=[泰坦尼克号, 诺丁山, 爱乐之城]], Films[type=科幻, movies=[盗梦空间, 银翼杀手2049, 星际穿越]]]
```

### 2.4. 流式响应

在浏览器中访问端点可以发现响应并非是一次性出现的，而是断断续续的流式的出现。

```java
@GetMapping(value = "/stream", produces = "text/event-stream;charset=UTF-8")
public Flux<String> getStream() {
    return openAiChatClient.prompt().user("你具体是什么模型。").stream().content();
}
```

当前版本`1.0.3`的流式响应无法使用`entity`方法直接获取实体对象，这需要我们进行显示的转换聚合。

```java
@GetMapping(value = "/stream-entity")
public List<Films> getStreamEntity(){
    BeanOutputConverter<List<Films>> listBeanOutputConverter = new BeanOutputConverter<>(new ParameterizedTypeReference<>() {
    });
    Flux<String> flux = openAiChatClient.prompt().user(u -> u.text("""
                    给出我3个不同类型的电影列表，每种电影类型给出我三部电影。
                    {format}
                    """)
                    .param("format", listBeanOutputConverter.getFormat()))
            .stream()
            .content();
    String collect = flux.collectList().block().stream().collect(Collectors.joining());
    return listBeanOutputConverter.convert(collect);
}
```

```text
[{"type":"动作","movies":["速度与激情","复仇者联盟","约翰·威克"]},{"type":"喜剧","movies":["超级坏","宿醉","王牌特工"]},{"type":"科幻","movies":["星际穿越","盗梦空间","银翼杀手2049"]}]
```

### 2.5. 提示词模板

ChatClient API 允许将用户和系统文本作为带变量的模板提供，这些变量在运行时被替换，如：

```java
openAiChatClient.prompt()
    .user(u -> u
            .text("Tell me the names of 5 movies whose soundtrack was composed by {composer}")
            .param("composer", "John Williams"))
    .call()
    .content();
```

模板变量默认由`{}`标记，但当提示词中有JSON时，显然默认的标记会不适用，这样的话我们需要使用不同的语法来避免提示词与JSON冲突，如可以使用`<`和`>`等。

```java
openAiChatClient.prompt()
    .user(u -> u
            .text("Tell me the names of 5 movies whose soundtrack was composed by <composer>")
            .param("composer", "John Williams"))
    .templateRenderer(StTemplateRenderer.builder().startDelimiterToken('<').endDelimiterToken('>').build())
    .call()
    .content();
```

### 2.6. 返回值
`call()`方法后，对于响应类型有几个不同的选项。

| 选择 | 类型 | 描述 |
|---|---|---|
|`content()` | `String`  | 响应的字符串内容 |
| `chatResponse()` | `ChatResponse`  | 包含多个生成内容以及关于响应的元数据，例如创建响应时使用了多少个 token。 |
| `chatClientResponse()` | `ChatClientResponse` | 包含 ChatResponse 对象和 ChatClient 执行上下文，让你能够访问顾问执行期间使用到的额外数据（例如在 RAG 流程中检索到的相关文档）。 |
| `responseEntity()` | `ResponseEntity<?>` | 包含完整的 HTTP 响应，包括状态码、标头和正文。当您需要访问响应的低级 HTTP 详细信息时，这很有用。 |
| `entity()` |  | 返回 Java 类型 |
| `entity(ParameterizedTypeReference<T> type)` | | 返回 Collection 的实体类型。 |
| `entity(Class<T> type)` | | 返回特定实体类型。 |
| `entity(StructuredOutputConverter<T> structuredOutputConverter)` | | 指定一个 StructuredOutputConverter 实例，将 String 转换为实体类型。 |

也可以调用`stream()`，而非`call()`。

> 调用 call() 方法实际上不会触发 AI 模型的执行。它只是指示 Spring AI 使用同步调用还是流式调用。实际的 AI 模型调用发生在调用 content() 、 chatResponse() 和 responseEntity() 等方法时。有点像惰性求值。

`stream()`方法后，对于响应类型有几个不同的选项。

| 选择 | 类型 | 描述 |
|---|---|---|
| `content()` | `Flux<String>` | 返回 AI 模型正在生成的字符串的 Flux 。 |
| `chatResponse()` | `Flux<ChatResponse>` | 返回一个 Flux ，其中包含有关响应的附加元数据。 |
| `chatClientResponse()` | `Flux<ChatClientResponse>` | 返回一个 Flux ，其中包含 ChatClientResponse 对象和 ChatClient 执行上下文，让你能够访问在顾问执行过程中使用到的额外数据（例如在 RAG 流程中检索到的相关文档）。 |

### 2.7. 默认值

关于默认提示词用法可[参考官网](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_using_defaults)。

## 3. Chat Memory

基于MySQL的消息存储：

```sql
CREATE TABLE IF NOT EXISTS SPRING_AI_CHAT_MEMORY (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  role VARCHAR(32) NULL,
  content TEXT NOT NULL,
  metadata TEXT NULL,
  type VARCHAR(32) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_conversation_time (conversation_id, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-chat-memory-repository-jdbc</artifactId>
</dependency>
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
```

```java
@Configuration
public class ChatMemoryConfig {
    @Bean
    public ChatMemory chatMemory(JdbcChatMemoryRepository jdbcRepository) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcRepository)
                .maxMessages(20)
                .build();
    }
}
```

```java
@Bean
public ChatClient GPTWithMemory(OpenAiChatModel openAiChatModel){
    return ChatClient.builder(openAiChatModel)
            .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
            .build();
}
```

以一个对话来说测试：

```java
    @GetMapping("/test-qa")
    public String TestQAWithMemory(@RequestParam String q) {
        String conversationID = "001";
        return gpt.prompt().user(q).advisors(a -> a.param(ChatMemory.CONVERSATION_ID,conversationID)).call().content();
    }
```

```text
> /test-qa?q=我的名字是小九，你的名字是什么
< 你好！我是一个人工智能助手，旨在回答你的问题和提供帮助。请问有什么我可以为你做的？
> /test-qa?q=我的名字是什么
< 你的名字是小九。如果你想告诉我其他名字或者有其他问题，随时可以说哦！
```

## 4. Tool Calling

### 4.1. 快速入门

定义一个工具来获取当前时间，因为模型无法直接的获取准确的时间，我们可以根据结果来判断工具是否被调用。

```java
public class DateTimeTools  {
    private static final Logger log = LoggerFactory.getLogger(DateTimeTools.class);

    @Tool(description = "Get the current date and time in the user's timezone")
    String getCurrentDateTime() {
        return LocalDateTime.now().atZone(LocaleContextHolder.getTimeZone().toZoneId()).toString();
    }
}
```

```java
@GetMapping("/test-tool")
private String testTool(){
    String conversationId = "002";
    return gpt.prompt()
            .user("获取现在的时间")
            .advisors(a -> a.param(ChatMemory.CONVERSATION_ID,conversationId))
            .tools(new DateTimeTools())
            .call()
            .content();
}
```

访问端点我们可以看到结果，可以看出工具被正确调用了。
> 现在的时间是 2025年10月6日 21:15:50（北京时间）。

现在模型成功的调用工具，那我们如何通过工具赋予模型“行为”？接下来我们定义一个新的工具，供AI调用，目的为定一个“闹钟”，当然了，这个“闹钟”并非实际意义上闹钟，而是通过打印一个日志来模拟执行。

```java
@Tool(description = "Set a user alarm for the given time, provided in ISO-8601 format")
void setAlarm(String time) {
    LocalDateTime alarmTime = LocalDateTime.parse(time, DateTimeFormatter.ISO_DATE_TIME);
    System.out.println("Alarm set for " + alarmTime);
}
```

```java
@GetMapping("/test-tools")
private String testTools(){
    String conversationId = "002";
    return gpt.prompt()
            .user("为我定一个30分钟后的闹钟")
            .advisors(a -> a.param(ChatMemory.CONVERSATION_ID,conversationId))
            .tools(new DateTimeTools())
            .call()
            .content();
}
```

> 浏览器输出：已为您设置一个30分钟后的闹钟，时间是21:57。 <br>（我是在21:27时请求的端点）<br>
控制台输出：Alarm set for 2025-10-06T21:57:02
