Carthage 是一个去中心化的依赖包管理器。CocoaPods 自动为你的应用创建和更新 Xcode 的 workspace 和 所有依赖。而 Carthage 通过 xcodebuild 工具构建二进制 framework，但是把集成这些framework到项目的权利留给了用户。CocoaPods 的方式比较简单，而 Carthage 更加灵活且非侵入性。也就是说使用Carthage后，想要集成哪些framework是你手动去控制的。所以说Carthage更轻量级一些。

<!-- more -->

使用方式
- cd ~/路径/项目文件夹
- touch Cartfile
- pod 'SDWebImage/WebP'
- 更新库 carthage update --platform iOS
- 在Carthage/Build/iOS文件夹下会生成对应的framework文件
- 在General->Linked Frameworks and Libraries中添加对应的framework
- 添加一个Run Script.shell里面/usr/local/bin/carthage copy-fr- ameworks...Input Files中$(SRCROOT)/Carthage/Build/iOS/SDWebImage.framework
