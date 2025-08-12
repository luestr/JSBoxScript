// 作者 https://t.me/ibilibili

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
  CONFIG_SAVED: "配置已保存",
  CACHE_CLEARED: "翻译缓存已全部清除",
  RELEASE_NOTES_PLACEHOLDER: "正在翻译发布说明，请稍候...",
  APP_DESCRIPTION_PLACEHOLDER: "正在翻译应用描述，请稍候..."
};

// 全局变量
let releaseNotesOriginal = "", appDescriptionOriginal = "";
let releaseNotesTranslated = "", appDescriptionTranslated = "";
let title = "";
let appId = "", appVersion = "", updateDate = "", bundleId = "";
let currentDisplayContent = 1; // 1: 翻译内容, 2: 原文内容
const link = $context.link;

// 样式配置（合并重复定义，支持Dark Mode）
const titleColor = $color({
  light: "#000000", // 浅色模式下使用黑色
  dark: "#FFFFFF"   // 深色模式下使用白色
});

const labelColor = $color({
  light: "#8E8E93",
  dark: "#8E8E93"
});

const valueColor = $color({
  light: "#000000",
  dark: "#FFFFFF"
});

const separatorColor = $color({
  light: "#E5E5EA",
  dark: "#38383A"
});

const cardColor = $color({
  light: "#FFFFFF",
  dark: "#1C1C1E"
});

const contentColor = $color({
  light: "#3C3C43",
  dark: "#EBEBF5"
});

// 通用卡片样式
const cardStyle = {
  bgcolor: cardColor,
  cornerRadius: 12,
  smoothCorners: true,
  shadowColor: $color("#000000"),
  shadowOpacity: 0.1,
  shadowOffset: $size(0, 2),
  shadowRadius: 8
};

// 通用alert配置
const defaultAlertAction = {
  title: "我知道了",
  handler: function() {}
};

// 通用文本组件样式
const textContentStyle = {
  font: $font(15),
  editable: false,
  selectable: false,
  scrollEnabled: false,
  bgcolor: $color("clear"),
  lines: 0,
  textContainerInset: $insets(0, 0, 0, 0),
  userInteractionEnabled: true,
  fixedWidth: true
};

// 通用按钮样式
const buttonStyle = {
  font: $font(16)
};

// 通用标题字体
const titleFont = $font("bold", 18);

// 移除未使用的宽度限制常量

// 创建按钮布局函数
function createButtonLayout(topInset) {
  return function(make, view) {
    make.left.right.inset(20);
    make.top.inset(topInset);
    make.height.equalTo(44);
  };
}

// 创建内容布局函数
function createContentLayout() {
  return function(make, view) {
    make.top.left.right.inset(16);
    make.bottom.inset(16);
    make.width.equalTo(view.super).offset(-32);
  };
}

// 通用长按复制事件处理函数
function createLongPressHandler(getValue) {
  return function(sender) {
    const value = typeof getValue === 'function' ? getValue() : getValue;
    $clipboard.text = value;
    $device.taptic(2);
  };
}



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
          props: Object.assign({
            title: "测试API"
          }, buttonStyle),
          layout: createButtonLayout(30),
          events: {
            tapped: function(sender) {
              testAPIConnection();
            }
          }
        },
        {
          type: "button",
          props: Object.assign({
            title: "保存配置"
          }, buttonStyle),
          layout: createButtonLayout(90),
          events: {
            tapped: function(sender) {
              saveConfig();
            }
          }
        },
        {
          type: "button",
          props: Object.assign({
            title: "清除缓存",
            bgcolor: $color("#FF6B6B")
          }, buttonStyle),
          layout: createButtonLayout(150),
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
  
  // 获取API Key输入框的值
  const apiKeyInput = listView.cell($indexPath(0, 0)).get("input");
  const apiKey = apiKeyInput ? apiKeyInput.text.trim() : "";
  
  // 获取模型选择器的值
  const modelTab = listView.cell($indexPath(0, 1)).get("tab");
  const modelIndex = modelTab ? modelTab.index : 0;
  
  return {
    apiKey,
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
  
  $cache.set(CONFIG_KEY, { apiKey, model });
  showError("成功", MESSAGES.CONFIG_SAVED);
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
                    actions: [defaultAlertAction]
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

// 显示测试结果
function showTestResult(title, message) {
  showError(title, message);
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
        try {
          if (resp.data?.output?.choices?.length > 0 || resp.data?.output?.text) {
            showTestResult("测试成功", "API连接正常，响应格式正确，可以正常使用翻译功能");
          } else {
            showTestResult("测试警告", `API连接成功但响应格式异常。\n响应数据: ${JSON.stringify(resp.data)}`);
          }
        } catch (e) {
          showTestResult("测试警告", `API连接成功但解析响应失败: ${e.message}`);
        }
      } else {
        const errorMsg = resp.data?.message || `HTTP错误: ${resp.response.statusCode}`;
        showTestResult("测试失败", `API连接失败：${errorMsg}`);
      }
    }
  });
}

// 查询App信息
function lookupApp(appid, region) {
  $http.get({
    url: `https://itunes.apple.com/${region}/lookup?id=${appid}`,
    handler: function(resp) {
      $ui.loading(false);
      if (resp.data?.results?.length > 0) {
        const result = resp.data.results[0];
        releaseNotesOriginal = result.releaseNotes || "暂无发布说明";
        appDescriptionOriginal = result.description || "暂无应用描述";
        title = result.trackName;
        appId = result.trackId;
        appVersion = result.version;
        updateDate = result.currentVersionReleaseDate.replace(/[a-z,A-Z]/g, " ").trim();
        bundleId = result.bundleId;
        
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
  
  // 先显示翻译结果页面，然后进行翻译
  releaseNotesTranslated = "";
  appDescriptionTranslated = "";
  showTranslationResult();
  
  // 通用翻译完成处理函数
  function handleTranslationComplete(isReleaseNotes, result, fromCache) {
    if (isReleaseNotes) {
      releaseNotesTranslated = result;
      if ($("release-notes-content")) {
        $("release-notes-content").text = result;
        $("release-notes-content").textColor = contentColor;
      }
    } else {
      appDescriptionTranslated = result;
      if ($("app-description-content")) {
        $("app-description-content").text = result;
        $("app-description-content").textColor = contentColor;
      }
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
  const textHash = text.length + "_" + text.substring(0, 50).replace(/[^a-zA-Z0-9]/g, "");
  return `translation_${model}_${textHash}`;
}

// 检查缓存是否过期（24小时）
function isCacheExpired(cacheData) {
  if (!cacheData?.timestamp) return true;
  return (Date.now() - cacheData.timestamp) > 24 * 60 * 60 * 1000;
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
            const errorMsg = resp.data?.message || `HTTP错误: ${resp.response.statusCode}`;
            callback(false, errorMsg, false);
          } else {
            try {
              let translatedText = "";
              if (resp.data?.output?.choices?.length > 0) {
                translatedText = resp.data.output.choices[0].message.content;
              } else if (resp.data?.output?.text) {
                translatedText = resp.data.output.text;
              } else {
                console.log("响应数据结构:", JSON.stringify(resp.data, null, 2));
                callback(false, `翻译响应格式错误，响应数据: ${JSON.stringify(resp.data)}`, false);
                return;
              }
              
              // 异步保存翻译结果到缓存
              const cacheData = {
                translatedText,
                timestamp: Date.now(),
                originalText: text,
                model
              };
              
              $cache.setAsync({
                key: cacheKey,
                value: cacheData,
                handler: () => callback(true, translatedText, false)
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
    actions: [defaultAlertAction]
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
            $("release-notes-content").textColor = contentColor;
            $("app-description-content").text = appDescriptionOriginal;
            $("app-description-content").textColor = contentColor;
            currentDisplayContent = 2;
          } else {
            $("release-notes-content").text = releaseNotesTranslated || MESSAGES.RELEASE_NOTES_PLACEHOLDER;
            $("release-notes-content").textColor = releaseNotesTranslated ? contentColor : labelColor;
            $("app-description-content").text = appDescriptionTranslated || MESSAGES.APP_DESCRIPTION_PLACEHOLDER;
            $("app-description-content").textColor = appDescriptionTranslated ? contentColor : labelColor;
            currentDisplayContent = 1;
          }
        }
      }]
    },
    views: [{
      type: "scroll",
      layout: $layout.fill,
      props: {
        bgcolor: $color({
          light: "#F2F2F7",
          dark: "#000000"
        }),
        contentWidth: $device.info.screen.width,
        alwaysBounceVertical: true,
        showsHorizontalScrollIndicator: false,
        showsVerticalScrollIndicator: true,
        bounces: true
      },
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
        // 应用信息标题
        {
          type: "label",
          props: {
            text: "应用信息",
            lines: 0,
            font: titleFont,
            textColor: titleColor,
            id: "update-version-title"
          },
          layout: function(make, view) {
            make.top.inset(16);
            make.left.right.inset(16);
          }
        },
        // 应用信息卡片
        {
          type: "view",
          props: Object.assign({
            id: "info-card"
          }, cardStyle),
          layout: function(make, view) {
            make.top.equalTo($("update-version-title").bottom).offset(8);
            make.left.right.inset(16);
            make.width.equalTo($device.info.screen.width - 32);
          },
          views: [
            // 应用编号行
            {
              type: "label",
              props: {
                text: "应用编号",
                font: $font(15),
                textColor: labelColor,
                id: "app-id-label"
              },
              layout: function(make, view) {
                make.top.inset(16);
                make.left.inset(16);
                make.width.equalTo(80);
              }
            },
            {
              type: "label",
              props: {
                text: "",
                font: $font(15),
                textColor: valueColor,
                id: "app-id-value",
                align: $align.right,
                lines: 0,
                userInteractionEnabled: true
              },
              layout: function(make, view) {
                make.centerY.equalTo($("app-id-label"));
                make.left.equalTo($("app-id-label").right).offset(8);
                make.right.inset(16);
              },
              events: {
                longPressed: createLongPressHandler(function() { return appId; })
              }
            },
            // 分隔线1
            {
              type: "view",
              props: {
                bgcolor: separatorColor
              },
              layout: function(make, view) {
                make.top.equalTo($("app-id-label").bottom).offset(12);
                make.left.inset(16);
                make.right.inset(16);
                make.height.equalTo(0.5);
              }
            },
            // 当前版本行
            {
              type: "label",
              props: {
                text: "当前版本",
                font: $font(15),
                textColor: labelColor,
                id: "version-label"
              },
              layout: function(make, view) {
                make.top.equalTo($("app-id-label").bottom).offset(24);
                make.left.inset(16);
                make.width.equalTo(80);
              }
            },
            {
              type: "label",
              props: {
                text: "",
                font: $font(15),
                textColor: valueColor,
                id: "version-value",
                align: $align.right,
                lines: 0,
                userInteractionEnabled: true
              },
              layout: function(make, view) {
                make.centerY.equalTo($("version-label"));
                make.left.equalTo($("version-label").right).offset(8);
                make.right.inset(16);
              },
              events: {
                longPressed: createLongPressHandler(function() { return appVersion; })
              }
            },
            // 分隔线2
            {
              type: "view",
              props: {
                bgcolor: separatorColor
              },
              layout: function(make, view) {
                make.top.equalTo($("version-label").bottom).offset(12);
                make.left.inset(16);
                make.right.inset(16);
                make.height.equalTo(0.5);
              }
            },
            // 更新日期行
            {
              type: "label",
              props: {
                text: "更新日期",
                font: $font(15),
                textColor: labelColor,
                id: "date-label"
              },
              layout: function(make, view) {
                make.top.equalTo($("version-label").bottom).offset(24);
                make.left.inset(16);
                make.width.equalTo(80);
              }
            },
            {
              type: "label",
              props: {
                text: "",
                font: $font(15),
                textColor: valueColor,
                id: "date-value",
                align: $align.right,
                lines: 0,
                userInteractionEnabled: true
              },
              layout: function(make, view) {
                make.centerY.equalTo($("date-label"));
                make.left.equalTo($("date-label").right).offset(8);
                make.right.inset(16);
              },
              events: {
                longPressed: createLongPressHandler(function() { return updateDate; })
              }
            },
            // 分隔线3
            {
              type: "view",
              props: {
                bgcolor: separatorColor
              },
              layout: function(make, view) {
                make.top.equalTo($("date-label").bottom).offset(12);
                make.left.inset(16);
                make.right.inset(16);
                make.height.equalTo(0.5);
              }
            },
            // 包标识符行
            {
              type: "label",
              props: {
                text: "包标识符",
                font: $font(15),
                textColor: labelColor,
                id: "bundle-label"
              },
              layout: function(make, view) {
                make.top.equalTo($("date-label").bottom).offset(24);
                make.left.inset(16);
                make.width.equalTo(80);
                make.bottom.inset(16);
              }
            },
            {
              type: "label",
              props: {
                text: "",
                font: $font(15),
                textColor: valueColor,
                id: "bundle-value",
                align: $align.right,
                lines: 0,
                userInteractionEnabled: true
              },
              layout: function(make, view) {
                make.centerY.equalTo($("bundle-label"));
                make.left.equalTo($("bundle-label").right).offset(8);
                make.right.inset(16);
              },
              events: {
                longPressed: createLongPressHandler(function() { return bundleId; })
              }
            }
          ]
        },
        // 发布说明标题
        {
          type: "label",
          props: {
            text: "发布说明",
            lines: 0,
            font: titleFont,
            textColor: titleColor,
            id: "release-notes-title"
          },
          layout: function(make, view) {
            make.top.equalTo($("info-card").bottom).offset(24);
            make.left.right.inset(16);
          }
        },
        // 发布说明卡片
        {
          type: "view",
          props: Object.assign({
            id: "release-notes-card"
          }, cardStyle),
          layout: function(make, view) {
            make.top.equalTo($("release-notes-title").bottom).offset(8);
            make.left.right.inset(16);
            make.width.equalTo($device.info.screen.width - 32);
          },
          views: [
            {
              type: "text",
              props: Object.assign({
                text: releaseNotesTranslated || MESSAGES.RELEASE_NOTES_PLACEHOLDER,
                textColor: releaseNotesTranslated ? contentColor : labelColor,
                id: "release-notes-content"
              }, textContentStyle),
              layout: createContentLayout(),
              events: {
                longPressed: createLongPressHandler(function() { return releaseNotesTranslated; })
              }
            }
          ]
        },
        // 应用描述标题
        {
          type: "label",
          props: {
            text: "应用描述",
            lines: 0,
            font: titleFont,
            textColor: titleColor,
            id: "app-description-title"
          },
          layout: function(make, view) {
            make.top.equalTo($("release-notes-card").bottom).offset(24);
            make.left.right.inset(16);
          }
        },
        // 应用描述卡片
        {
          type: "view",
          props: Object.assign({
            id: "app-description-card"
          }, cardStyle),
          layout: function(make, view) {
            make.top.equalTo($("app-description-title").bottom).offset(8);
            make.left.right.inset(16);
            make.bottom.inset(16);
            make.width.equalTo($device.info.screen.width - 32);
          },
          views: [
            {
              type: "text",
              props: Object.assign({
                text: appDescriptionTranslated || MESSAGES.APP_DESCRIPTION_PLACEHOLDER,
                textColor: appDescriptionTranslated ? contentColor : labelColor,
                id: "app-description-content"
              }, textContentStyle),
              layout: createContentLayout(),
              events: {
                longPressed: createLongPressHandler(function() { return appDescriptionTranslated; })
              }
            }
          ]
        }
      ]
    }]
  });
  
  // 填充应用信息数据
  setTimeout(function() {
    if ($("app-id-value")) {
      $("app-id-value").text = appId;
    }
    if ($("version-value")) {
      $("version-value").text = appVersion;
    }
    if ($("date-value")) {
      $("date-value").text = updateDate;
    }
    if ($("bundle-value")) {
      $("bundle-value").text = bundleId;
    }
  }, 100);
}
