之前看到过其他 App 在不更新版本的情况下自动更换了图标。后来查了一下是 iOS 10.3 之后出了新的 API 。猜测他们是用了这个 API ，不过要兼容低版本的怎么办？目前还没有查到具体做法，还是先研究一下这个 API 吧。

## 演示效果

![](./_image/05.gif?r=60)

搞了一个 demo ，可以随意切换图标。地址 [https://github.com/lzcdev/ChangeAppIcon](https://github.com/lzcdev/ChangeAppIcon)
## API
```
@interface UIApplication (UIAlternateApplicationIcons)
// If false, alternate icons are not supported for the current process.
@property (readonly, nonatomic) BOOL supportsAlternateIcons NS_EXTENSION_UNAVAILABLE("Extensions may not have alternate icons") API_AVAILABLE(ios(10.3), tvos(10.2));

// Pass `nil` to use the primary application icon. The completion handler will be invoked asynchronously on an arbitrary background queue; be sure to dispatch back to the main queue before doing any further UI work.
- (void)setAlternateIconName:(nullable NSString *)alternateIconName completionHandler:(nullable void (^)(NSError *_Nullable error))completionHandler NS_EXTENSION_UNAVAILABLE("Extensions may not have alternate icons") API_AVAILABLE(ios(10.3), tvos(10.2));

// If `nil`, the primary application icon is being used.
@property (nullable, readonly, nonatomic) NSString *alternateIconName NS_EXTENSION_UNAVAILABLE("Extensions may not have alternate icons") API_AVAILABLE(ios(10.3), tvos(10.2));
@end
```

- `supportsAlternateIcons` 用来判断是否允许修改 App 图标，默认是允许的
- `setAlternateIconName:completionHandler:` 这个方法用来修改图标，`iconName` 是你要修改的图标名字，如果 `iconName` 为 `nil`，则恢复为原来的主图标。

## 步骤
要想使用该 `API` ，需要对 `Info.plist` 做一些相关的配置。这里主要配置的是 `CFBundleIcons`，它包含 `CFBundlePrimaryIcon`、`CFBundleAlternateIcons`、`UINewsstandIcon` 三个键。其中 `CFBundlePrimaryIcon` 为主图标，即 `Assets.xcassets` 中配置的图标，这个不需做配置。`CFBundleAlternateIcons` 是真正要替换的图标，主要就是配置这个。`UINewsstandIcon` 这个一般是报刊杂志类需要配置一些信息，这里暂时还用不到。直观的看一下 `Info.plist`配置。

![](./_image/2018-05-30-14-24-34.jpg)

需要注意的是要替换的图标不能放在 `Assets.xcassets` 中，应放在工程中某个目录下。配置好以上内容，然后实现该 `API` 就可以实现动态更改图标了。不过会发现每次更改图标都会强制弹出一个提示框。下面就研究一下怎么样不弹出提示框的情况下修改图标。

## 改进
很容易联想到弹出的提示框是调用了系统的 `UIAlertController` 里面的 `presentViewController:animated:completion:`方法。那么利用 `Method swizzling` ` hook` 该弹框就可以了。为 `UIViewController` 写一个分类，这里有个小技巧是更改图标时提示框的 `title` 和 `message` 都是 `nil` 的，正好利用这一点使其不要弹出。
```
#import "UIViewController+Present.h"
#import <objc/runtime.h>

@implementation UIViewController (Present)

+ (void)load {
    Method present = class_getInstanceMethod(self.class, @selector(presentViewController:animated:completion:));
    Method my_present = class_getInstanceMethod(self.class, @selector(my_presentViewController:animated:completion:));
    method_exchangeImplementations(present, my_present);
}

- (void)my_presentViewController:(UIViewController *)viewControllerToPresent animated:(BOOL)flag completion:(void (^)(void))completion {
    if ([viewControllerToPresent isKindOfClass:[UIAlertController class]]) {
        NSLog(@"title%@", (UIAlertController *)viewControllerToPresent.title);
        NSLog(@"message%@", ((UIAlertController *)viewControllerToPresent).message);
        
        UIAlertController *alertController = (UIAlertController *)viewControllerToPresent;
        if (alertController.title == nil && alertController.message == nil) {
            return;
        } else {
            [self my_presentViewController:viewControllerToPresent animated:flag completion:completion];
            return;
        }
    }
    
    [self my_presentViewController:viewControllerToPresent animated:flag completion:completion];
}
```
## 总结
目前可以实现在 `iOS10.3` 上动态更改图标，不过目测此方法还是有点鸡肋。毕竟需要事先内置图片并且做好相关配置，实在是不够灵活。


