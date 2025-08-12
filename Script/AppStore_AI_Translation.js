// t.me/ibilibili

$app.theme = "auto"; // 启用Dark Mode自动切换支持

// 配置存储键名
const CONFIG_KEY = "qwen_translator_config";

// 默认配置
const DEFAULT_CONFIG = {
  apiKey: "",
  model: "qwen-mt-turbo"
};

// 可用模型列表
const MODELS = ["qwen-mt-turbo", "qwen-mt-plus"];

// 常用文本常量
const MESSAGES = {
  API_KEY_REQUIRED: "请输入API Key",
  CONFIG_REQUIRED: "请先在JSBox内运行此脚本进行配置",
  TRANSLATING: "正在翻译...",
  TRANSLATION_COMPLETE: "翻译完成",
  CONFIG_SAVED: "配置已保存",
  CACHE_CLEARED: "翻译缓存已全部清除"
};

// 全局变量
let releaseNotesOriginal = "", appDescriptionOriginal = "";
let releaseNotesTranslated = "", appDescriptionTranslated = "";
let introduction = "";
let title = "";
let currentDisplayContent = 1; // 1: 翻译内容, 2: 原文内容
const link = $context.link;

// 样式配置（合并重复定义，支持Dark Mode）
const titleFont = $font("bold", 20);
const contentFont = $font(16);
const titleColor = $color("#ef475d"); // 保持红色主题色不变
const contentColor = $color({
  light: "#000000", // 浅色模式下使用黑色
  dark: "#FFFFFF"   // 深色模式下使用白色
});

// 主入口
if (($app.env == $env.action) && link) {
  // 在App Store分享环境下运行
  checkConfigAndTranslate();
} else {
  // 在JSBox内运行，显示配置页面
  showConfigPage();
}

// 检查配置并开始翻译
function checkConfigAndTranslate() {
  const config = getConfig();
  if (!config.apiKey) {
    showError("配置错误", MESSAGES.CONFIG_REQUIRED);
    return;
  }
  
  $ui.loading("正在获取内容...");
  
  // 解析App Store链接
  const regex = /.+id(\d+).*/;
  const match = regex.exec(link);
  const appid = match[1];
  
  const regexNew = /.com\/([a-z][A-z])\/app/;
  const matchNew = regexNew.exec(link);
  const region = matchNew[1];
  
  if (appid) {
    lookupApp(appid, region);
  }
}

// 显示配置页面
function showConfigPage() {
  const config = getConfig();
  
  $ui.render({
    props: {
      title: "Qwen翻译配置"
    },
    views: [{
      type: "list",
      props: {
        grouped: false,
        rowHeight: 64.0,
        scrollEnabled: false,
        template: [
          {
            type: "label",
            props: {
              id: "title",
              font: $font("bold", 16)
            },
            layout: function(make) {
              make.left.equalTo(15);
              make.top.inset(8);
              make.height.equalTo(24);
              make.width.equalTo(100);
            }
          },
          {
            type: "input",
            props: {
              id: "input",
              font: $font(14),
              textColor: $color("#333333")
            },
            layout: function(make) {
              make.left.equalTo(120);
              make.right.inset(15);
              make.centerY.equalTo($("title"));
              make.height.equalTo(32);
            }
          },
          {
            type: "tab",
            props: {
              id: "tab",
              tintColor: $color("#007AFF")
            },
            layout: function(make) {
              make.left.equalTo(120);
              make.right.inset(15);
              make.centerY.equalTo($("title"));
              make.height.equalTo(32);
            }
          }
        ],
        data: [
          {
            title: "基本配置",
            rows: [
              {
                title: {
                  text: "API Key"
                },
                input: {
                  placeholder: "请输入DashScope API Key",
                  secure: true,
                  text: config.apiKey
                },
                tab: {
                  hidden: true
                },
                type: "input"
              },
              {
                title: {
                  text: "翻译模型"
                },
                input: {
                  hidden: true
                },
                tab: {
                  items: MODELS,
                  index: MODELS.indexOf(config.model)
                },
                type: "tab"
              }
            ]
          }
        ]
      },
      layout: function(make, view) {
        make.top.left.right.equalTo(0);
        make.height.equalTo(200);
      },
      events: {
        didSelect: function(sender, indexPath) {
          // 对于输入和选择项，不需要处理点击事件
        }
      }
    }, {
      type: "view",
      props: {
        id: "button-container"
      },
      layout: function(make, view) {
        make.left.right.equalTo(0);
        make.top.equalTo($("list").bottom).offset(20);
        make.height.equalTo(240);
      },
      views: [
        {
          type: "button",
          props: {
            title: "测试API",
            font: $font(16)
          },
          layout: function(make, view) {
            make.left.right.inset(20);
            make.top.inset(30);
            make.height.equalTo(44);
          },
          events: {
            tapped: function(sender) {
              testAPIConnection();
            }
          }
        },
        {
          type: "button",
          props: {
            title: "保存配置",
            font: $font(16)
          },
          layout: function(make, view) {
            make.left.right.inset(20);
            make.top.inset(90);
            make.height.equalTo(44);
          },
          events: {
            tapped: function(sender) {
              saveConfig();
            }
          }
        },
        {
          type: "button",
          props: {
            title: "清除缓存",
            font: $font(16),
            bgcolor: $color("#FF6B6B")
          },
          layout: function(make, view) {
            make.left.right.inset(20);
            make.top.inset(150);
            make.height.equalTo(44);
          },
          events: {
            tapped: function(sender) {
              clearTranslationCache();
            }
          }
        },
        {
          type: "label",
          props: {
            text: "使用说明：在App Store应用详情页分享运行此脚本时，直接翻译；在JSBox内运行此脚本时，进入配置页面",
            textColor: $color("#8E8E93"),
            align: $align.center,
            font: $font(10),
            lines: 0
          },
          layout: function(make, view) {
            make.bottom.inset(10);
            make.left.right.inset(20);
            make.height.equalTo(30);
          }
        }
      ]
    }]
  });
}

// 获取配置
function getConfig() {
  const savedConfig = $cache.get(CONFIG_KEY);
  return savedConfig ? Object.assign({}, DEFAULT_CONFIG, savedConfig) : DEFAULT_CONFIG;
}

// 通用函数：从UI获取配置值
function getConfigFromUI() {
  const listView = $("list");
  let apiKey = "";
  let modelIndex = 0;
  
  // 获取API Key输入框的值
  const apiKeyCell = listView.cell($indexPath(0, 0));
  const apiKeyInput = apiKeyCell.get("input");
  if (apiKeyInput) {
    apiKey = apiKeyInput.text.trim();
  }
  
  // 获取模型选择器的值
  const modelCell = listView.cell($indexPath(0, 1));
  const modelTab = modelCell.get("tab");
  if (modelTab) {
    modelIndex = modelTab.index;
  }
  
  return {
    apiKey: apiKey,
    model: MODELS[modelIndex]
  };
}

// 保存配置
function saveConfig() {
  const { apiKey, model } = getConfigFromUI();
  
  if (!apiKey) {
    showError("错误", MESSAGES.API_KEY_REQUIRED);
    return;
  }
  
  const config = { apiKey, model };
  $cache.set(CONFIG_KEY, config);
  
  $ui.alert({
    title: "成功",
    message: MESSAGES.CONFIG_SAVED
  });
}

// 清除翻译缓存
function clearTranslationCache() {
  $ui.alert({
    title: "确认清除缓存",
    message: "确定要清除所有翻译缓存吗？此操作不可撤销。",
    actions: [
      {
        title: "取消",
        style: "Cancel",
        handler: function() {}
      },
      {
        title: "确定清除",
        style: "Destructive",
        handler: function() {
          $ui.loading("正在清除翻译缓存...");
          
          // 先备份配置
          const config = getConfig();
          
          // 清除所有缓存
          $cache.clearAsync({
            handler: function() {
              // 恢复配置
              $cache.setAsync({
                key: CONFIG_KEY,
                value: config,
                handler: function() {
                  $ui.loading(false);
                  $ui.alert({
                    title: "清除完成",
                    message: MESSAGES.CACHE_CLEARED,
                    actions: [{
                      title: "我知道了",
                      handler: function() {}
                    }]
                  });
                }
              });
            }
          });
        }
      }
    ]
  });
}

// 测试API连接
function testAPIConnection() {
  const { apiKey, model } = getConfigFromUI();
  
  if (!apiKey) {
    showError("错误", MESSAGES.API_KEY_REQUIRED);
    return;
  }
  
  $ui.loading("正在测试API连接...");
  
  // 使用简单的测试文本
  const requestData = {
    model: model,
    input: {
      messages: [{
        content: "Test",
        role: "user"
      }]
    },
    parameters: {
      translation_options: {
        source_lang: "auto",
        target_lang: "Chinese"
      }
    }
  };
  
  $http.request({
    method: "POST",
    url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    header: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: requestData,
    timeout: 10,
    handler: function(resp) {
      $ui.loading(false);
      if (resp.response.statusCode === 200) {
        // 验证响应格式是否正确
        try {
          if (resp.data && resp.data.output && resp.data.output.choices && resp.data.output.choices.length > 0) {
            $ui.alert({
              title: "测试成功",
              message: "API连接正常，响应格式正确，可以正常使用翻译功能",
              actions: [{
                title: "我知道了",
                handler: function() {}
              }]
            });
          } else if (resp.data && resp.data.output && resp.data.output.text) {
            $ui.alert({
              title: "测试成功",
              message: "API连接正常，响应格式正确，可以正常使用翻译功能",
              actions: [{
                title: "我知道了",
                handler: function() {}
              }]
            });
          } else {
            $ui.alert({
              title: "测试警告",
              message: `API连接成功但响应格式异常。\n响应数据: ${JSON.stringify(resp.data)}`,
              actions: [{
                title: "我知道了",
                handler: function() {}
              }]
            });
          }
        } catch (e) {
          $ui.alert({
            title: "测试警告",
            message: `API连接成功但解析响应失败: ${e.message}`,
            actions: [{
              title: "我知道了",
              handler: function() {}
            }]
          });
        }
      } else {
        const errorMsg = resp.data && resp.data.message ? resp.data.message : `HTTP错误: ${resp.response.statusCode}`;
        $ui.alert({
          title: "测试失败",
          message: `API连接失败：${errorMsg}`,
          actions: [{
            title: "我知道了",
            handler: function() {}
          }]
        });
      }
    }
  });
}

// 查询App信息
function lookupApp(appid, region) {
  const url = `https://itunes.apple.com/${region}/lookup?id=${appid}`;
  
  $http.get({
    url: url,
    handler: function(resp) {
      $ui.loading(false);
      if (resp.data && resp.data.results && resp.data.results.length > 0) {
        const result = resp.data.results[0];
        releaseNotesOriginal = result.releaseNotes || "暂无发布说明";
        appDescriptionOriginal = result.description || "暂无应用描述";
        title = result.trackName;
        introduction = `应用编号：${result.trackId}\n当前版本：${result.version}\n更新日期：${result.currentVersionReleaseDate.replace(/[a-z,A-Z]/g, " ")}\n包标识符：${result.bundleId}`;
        
        startTranslation();
      } else {
        showError("获取应用详情失败", "请检查网络，并重新尝试运行脚本");
      }
    }
  });
}

// 开始翻译流程
function startTranslation() {
  const config = getConfig();
  
  // 翻译任务完成状态变量
  let releaseNotesTranslationCompleted = false;
  let appDescriptionTranslationCompleted = false;
  let translationStatusInterval = null;
  
  // 先显示翻译结果页面，然后进行翻译
  releaseNotesTranslated = "";
  appDescriptionTranslated = "";
  showTranslationResult();
  
  // 检查翻译状态的函数
  function checkTranslationStatus() {
    if (releaseNotesTranslationCompleted && appDescriptionTranslationCompleted) {
      if (translationStatusInterval) {
        clearInterval(translationStatusInterval);
        translationStatusInterval = null;
      }
      $ui.toast(MESSAGES.TRANSLATION_COMPLETE);
    }
  }
  
  // 通用翻译完成处理函数
  function handleTranslationComplete(isReleaseNotes, result, fromCache) {
    if (isReleaseNotes) {
      releaseNotesTranslated = result;
      releaseNotesTranslationCompleted = true;
      if ($("release-notes-content")) {
        $("release-notes-content").text = result;
      }
    } else {
      appDescriptionTranslated = result;
      appDescriptionTranslationCompleted = true;
      if ($("app-description-content")) {
        $("app-description-content").text = result;
      }
    }
    
    // 检查是否两个任务都完成了
    if (releaseNotesTranslationCompleted && appDescriptionTranslationCompleted) {
      checkTranslationStatus();
    } else if (!fromCache && !translationStatusInterval) {
      // 如果当前任务不是从缓存获取且未启动监控，启动状态监控
      $ui.toast(MESSAGES.TRANSLATING);
        translationStatusInterval = setInterval(function() {
          if (releaseNotesTranslationCompleted && appDescriptionTranslationCompleted) {
            clearInterval(translationStatusInterval);
            translationStatusInterval = null;
            $ui.toast(MESSAGES.TRANSLATION_COMPLETE);
          } else {
            $ui.toast(MESSAGES.TRANSLATING);
          }
       }, 1000);
    }
  }
  
  // 并行翻译发布说明和应用描述
  translateWithQwen(releaseNotesOriginal, config.apiKey, config.model, 
    function(success, result, fromCache) {
      if (success) {
        handleTranslationComplete(true, result, fromCache);
      } else {
        showTranslationError(result);
      }
    }
  );
  
  translateWithQwen(appDescriptionOriginal, config.apiKey, config.model,
    function(success, result, fromCache) {
      if (success) {
        handleTranslationComplete(false, result, fromCache);
      } else {
        showTranslationError(result);
      }
    }
  );
}

// 生成缓存键
function generateCacheKey(text, model) {
  // 使用文本内容和模型生成唯一缓存键
  const textHash = text.length + "_" + text.substring(0, 50).replace(/[^a-zA-Z0-9]/g, "");
  return `translation_${model}_${textHash}`;
}

// 检查缓存是否过期（24小时）
function isCacheExpired(cacheData) {
  if (!cacheData || !cacheData.timestamp) {
    return true;
  }
  const now = new Date().getTime();
  const cacheTime = cacheData.timestamp;
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24小时的毫秒数
  return (now - cacheTime) > twentyFourHours;
}

// 使用Qwen翻译（非流式输出，因为qwen-mt模型不支持增量式流式输出）
function translateWithQwen(text, apiKey, model, callback) {
  const cacheKey = generateCacheKey(text, model);
  
  // 异步检查缓存
  $cache.getAsync({
    key: cacheKey,
    handler: function(cacheData) {
      // 检查缓存是否存在且未过期
      if (cacheData && !isCacheExpired(cacheData)) {
        // 使用缓存的翻译结果
        callback(true, cacheData.translatedText, true);
        return;
      }
      
      // 缓存不存在或已过期，进行翻译
      const requestData = {
        model: model,
        input: {
          messages: [{
            content: text,
            role: "user"
          }]
        },
        parameters: {
          translation_options: {
            source_lang: "auto",
            target_lang: "Chinese"
          }
        }
      };
      
      $http.request({
        method: "POST",
        url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        header: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: requestData,
        timeout: 60,
        handler: function(resp) {
          if (resp.response.statusCode !== 200) {
            const errorMsg = resp.data && resp.data.message ? resp.data.message : `HTTP错误: ${resp.response.statusCode}`;
            callback(false, errorMsg, false);
          } else {
            try {
              let translatedText = "";
              if (resp.data && resp.data.output && resp.data.output.choices && resp.data.output.choices.length > 0) {
                // 处理DashScope原生模式的响应格式
                translatedText = resp.data.output.choices[0].message.content;
              } else if (resp.data && resp.data.output && resp.data.output.text) {
                // 兼容处理其他可能的响应格式
                translatedText = resp.data.output.text;
              } else {
                // 尝试解析其他可能的响应格式
                console.log("响应数据结构:", JSON.stringify(resp.data, null, 2));
                callback(false, `翻译响应格式错误，响应数据: ${JSON.stringify(resp.data)}`, false);
                return;
              }
              
              // 异步保存翻译结果到缓存
              const cacheData = {
                translatedText: translatedText,
                timestamp: new Date().getTime(),
                originalText: text,
                model: model
              };
              
              $cache.setAsync({
                key: cacheKey,
                value: cacheData,
                handler: function() {
                  // 缓存保存完成，返回翻译结果
                  callback(true, translatedText, false);
                }
              });
            } catch (e) {
              callback(false, `解析响应失败: ${e.message}`, false);
            }
          }
        }
      });
    }
  });
}

// 通用错误处理函数
function showError(title, message, details = null) {
  const fullMessage = details ? `${message}\n\n${details}` : message;
  $ui.alert({
    title: title,
    message: fullMessage,
    actions: [{
      title: "我知道了",
      handler: function() {}
    }]
  });
}

// 显示翻译错误
function showTranslationError(errorMessage) {
  showError("翻译失败", `错误信息: ${errorMessage}`, "请检查：\n1. API Key是否正确\n2. 网络连接是否正常\n3. 账户余额是否充足");
}

// 显示翻译结果
function showTranslationResult() {
  $ui.render({
    props: {
      title: title,
      navButtons: [{
        title: "原文/译文",
        icon: "041",
        handler: function() {
          if (currentDisplayContent == 1) {
            $("release-notes-content").text = releaseNotesOriginal;
            $("app-description-content").text = appDescriptionOriginal;
            currentDisplayContent = 2;
          } else {
            $("release-notes-content").text = releaseNotesTranslated;
            $("app-description-content").text = appDescriptionTranslated;
            currentDisplayContent = 1;
          }
        }
      }]
    },
    views: [{
      type: "scroll",
      layout: $layout.fill,
      events: {
        didScroll: function(sender) {
          const pointOffsetY = sender.contentOffset.y * -1;
          if (pointOffsetY >= 100) {
            $device.taptic(2);
          }
        },
        didEndDragging: function(sender) {
          const pointOffsetY = sender.contentOffset.y * -1;
          if (pointOffsetY > 100) {
            $context.close();
          }
        }
      },
      views: [
        {
          type: "label",
          props: {
            text: "当前版本：",
            lines: 0,
            font: titleFont,
            textColor: titleColor,
            id: "update-version-title"
          },
          layout: function(make, view) {
            make.top.left.inset(10);
            make.width.equalTo(view.super).offset(-20);
          }
        },
        {
          type: "text",
          props: {
            text: introduction,
            font: contentFont,
            textColor: contentColor,
            id: "update-version",
            editable: false,
            selectable: true,
            scrollEnabled: false
          },
          layout: function(make, view) {
            make.top.equalTo($("update-version-title").bottom).offset(5);
            make.left.inset(10);
            make.width.equalTo(view.super).offset(-20);
          }
        },
        {
          type: "label",
          props: {
            text: "发布说明：",
            lines: 0,
            font: titleFont,
            textColor: titleColor,
            id: "release-notes-title"
          },
          layout: function(make, view) {
            make.top.equalTo($("update-version").bottom).offset(30);
            make.left.inset(10);
            make.width.equalTo(view.super).offset(-20);
          }
        },
        {
          type: "text",
          props: {
            text: releaseNotesTranslated,
            font: contentFont,
            textColor: contentColor,
            id: "release-notes-content",
            editable: false,
            selectable: true,
            scrollEnabled: false
          },
          layout: function(make, view) {
            make.top.equalTo($("release-notes-title").bottom).offset(5);
            make.left.equalTo($("release-notes-title"));
            make.width.equalTo($("release-notes-title"));
          }
        },
        {
          type: "label",
          props: {
            text: "应用描述：",
            lines: 0,
            font: titleFont,
            textColor: titleColor,
            id: "app-description-title"
          },
          layout: function(make, view) {
            make.top.equalTo($("release-notes-content").bottom).offset(30);
            make.left.equalTo($("release-notes-content"));
            make.width.equalTo($("release-notes-content"));
          }
        },
        {
          type: "text",
          props: {
            text: appDescriptionTranslated,
            font: contentFont,
            textColor: contentColor,
            id: "app-description-content",
            editable: false,
            selectable: true,
            scrollEnabled: false
          },
          layout: function(make, view) {
            make.top.equalTo($("app-description-title").bottom).offset(5);
            make.left.equalTo($("app-description-title"));
            make.width.equalTo($("app-description-title"));
            make.bottom.equalTo(view.super).offset(-10);
          }
        }
      ]
    }]
  });
}
