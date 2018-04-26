## 一、Category简介
> You use categories to define additional methods of an existing class—even one whose source code is unavailable to you—without subclassing.

Category是Objective-C 2.0之后添加的语言特性。它的主要作用是在不改变原有类的前提下，动态地给这个类添加一些方法。这样可以做到不访问源码又能扩展其功能的目的，且保证了原始类拥有较小的体积，很多开源框架都应用了这一特性。

## 二、使用场景
- 给现有类添加新的方法（常用）
- 声明私有方法
- 模拟多继承
- 把framework的私有方法公开

## 三、分析runtime源码下的Category实现原理
下载最新版 [runtime](http://opensource.apple.com/tarballs/objc4/) 源码，本例用的` objc4-706.tar.gz`。打开runtime文件夹下的`objc-runtime-new.h`，可以看到category的定义。
```oc
struct category_t {
    const char *name; //类名字
    classref_t cls; // 类
    struct method_list_t *instanceMethods; // 实例方法列表
    struct method_list_t *classMethods; // 类方法列表
    struct protocol_list_t *protocols; // 协议列表
    struct property_list_t *instanceProperties;  // 实例属性列表（添加到类上）
    // Fields below this point are not always present on disk.
    struct property_list_t *_classProperties; // 类属性列表（添加到元类上），这里说了它并不总是存在当前的磁盘上。（为什么这样我还没想通）
    method_list_t *methodsForMeta(bool isMeta) {
        if (isMeta) return classMethods;
        else return instanceMethods;
    } // 元类方法列表

    property_list_t *propertiesForMeta(bool isMeta, struct header_info *hi); // 元类属性列表
};
```
从这个结构体看出category可以添加实例方法和类方法，实现协议，添加属性。
下面打开runtime文件夹下的`objc-runtime-new.mm`，找到` void _read_images(header_info **hList, uint32_t hCount, int totalClasses, int unoptimizedTotalClasses)`这个方法，下面这段是关键部分
```oc
    // Process this category. 
            // First, register the category with its target class. 
            // Then, rebuild the class's method lists (etc) if 
            // the class is realized. 
            bool classExists = NO;
            if (cat->instanceMethods ||  cat->protocols  
                ||  cat->instanceProperties) 
            {
                addUnattachedCategoryForClass(cat, cls, hi);
                if (cls->isRealized()) {
                    remethodizeClass(cls);
                    classExists = YES;
                }
                if (PrintConnecting) {
                    _objc_inform("CLASS: found category -%s(%s) %s", 
                                 cls->nameForLogging(), cat->name, 
                                 classExists ? "on existing class" : "");
                }
            }

            if (cat->classMethods  ||  cat->protocols  
                ||  (hasClassProperties && cat->_classProperties)) 
            {
                addUnattachedCategoryForClass(cat, cls->ISA(), hi);
                if (cls->ISA()->isRealized()) {
                    remethodizeClass(cls->ISA());
                }
                if (PrintConnecting) {
                    _objc_inform("CLASS: found category +%s(%s)", 
                                 cls->nameForLogging(), cat->name);
                }
            }
```
这里有必要了解一下什么是元类，[Objective-C 中的元类（meta class）是什么？](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&ved=0ahUKEwjEh-HltMfSAhXLiFQKHW0QB-EQFggaMAA&url=http%3A%2F%2Fios.jobbole.com%2F81657%2F&usg=AFQjCNF1YjPaxwmESdhd4A3RMOoatcJpCw&sig2=XfnhX-25WbwbtXEeaaG6Yw&cad=rja)，[《Objective-C 对象模型》](http://blog.leichunfeng.com/blog/2015/04/25/objective-c-object-model/)
这段代码的主要作用是
* 注册category和他的主类，也就是把category的实例方法、协议以及属性添加到类上，把category的类方法和协议以及属性添加到类的metaclass上
* 如果类已经实现则重建它的方法列表

根据`remethodizeClass(cls)`和`remethodizeClass(cls->ISA())`这个方法继续往下找，可以看到`remethodizeClass`方法的实现
```oc
static void remethodizeClass(Class cls)
{
    category_list *cats;
    bool isMeta;

    runtimeLock.assertWriting();

    isMeta = cls->isMetaClass();

    // Re-methodizing: check for more categories
    if ((cats = unattachedCategoriesForClass(cls, false/*not realizing*/))) {
        if (PrintConnecting) {
            _objc_inform("CLASS: attaching categories to class '%s' %s", 
                         cls->nameForLogging(), isMeta ? "(meta)" : "");
        }
        
        attachCategories(cls, cats, true /*flush caches*/);        
        free(cats);
    }
}
```
分析这段代码发现这还不是最终的方法，继续顺藤摸瓜找到`attachCategories(cls, cats, true /*flush caches*/)`这个方法
```oc
// Attach method lists and properties and protocols from categories to a class.
// Assumes the categories in cats are all loaded and sorted by load order, 
// oldest categories first.
static void 
attachCategories(Class cls, category_list *cats, bool flush_caches)
{
    if (!cats) return;
    if (PrintReplacedMethods) printReplacements(cls, cats);

    bool isMeta = cls->isMetaClass();

    // fixme rearrange to remove these intermediate allocations
    method_list_t **mlists = (method_list_t **)
        malloc(cats->count * sizeof(*mlists));
    property_list_t **proplists = (property_list_t **)
        malloc(cats->count * sizeof(*proplists));
    protocol_list_t **protolists = (protocol_list_t **)
        malloc(cats->count * sizeof(*protolists));

    // Count backwards through cats to get newest categories first
    int mcount = 0;
    int propcount = 0;
    int protocount = 0;
    int i = cats->count;
    bool fromBundle = NO;
    while (i--) {
        auto& entry = cats->list[i];

        method_list_t *mlist = entry.cat->methodsForMeta(isMeta);
        if (mlist) {
            mlists[mcount++] = mlist;
            fromBundle |= entry.hi->isBundle();
        }

        property_list_t *proplist = 
            entry.cat->propertiesForMeta(isMeta, entry.hi);
        if (proplist) {
            proplists[propcount++] = proplist;
        }

        protocol_list_t *protolist = entry.cat->protocols;
        if (protolist) {
            protolists[protocount++] = protolist;
        }
    }

    auto rw = cls->data();

    prepareMethodLists(cls, mlists, mcount, NO, fromBundle);
    rw->methods.attachLists(mlists, mcount);
    free(mlists);
    if (flush_caches  &&  mcount > 0) flushCaches(cls);

    rw->properties.attachLists(proplists, propcount);
    free(proplists);

    rw->protocols.attachLists(protolists, protocount);
    free(protolists);
}
```
通过注释就可以看到，这个方法才是真正的把catrgory的方法、属性、协议整合到主类中的。这里的整合其实是合并在一起的，并没有真正覆盖掉原来主类的方法，而是添加到原先方法的前面，掉用的时候发现前面的方法就会执行并且停止查询了，所以给了人们category可以''覆盖''主类方法的错觉。其实只要顺着方法列表找到最后一个对应名字的方法，也是可以调用原来类的方法的。
下面就做个实验验证一下：本段代码参考[深入理解Objective-C：Category](http://tech.meituan.com/DiveIntoCategory.html)，写一个MyClass的分类打印myAdditionClass。这个小测验也可以在我的[GitHub](https://github.com/zcLu/CategoryDemo)找到。
```oc
#import "MyClass.h"

@implementation MyClass

- (void)printName {
    NSLog(@"myClass");
}

@end

#import "MyClass+MyAddition.h"

@implementation MyClass (MyAddition)

- (void)printName {
    NSLog(@"myAdditionClass");
}

@end

```
下面这段就是找主类中的方法。
```oc
    MyClass *class = [[MyClass alloc]init];
    [class printName]; //执行分类的方法打印的是myAdditionClass
    
    
    Class currentClass = [MyClass class];
    MyClass *my = [[MyClass alloc] init];
    if (currentClass) {
        unsigned int methodCount;
        Method *methodList = class_copyMethodList(currentClass, &methodCount);// 方法列表（包含主类和分类中的方法）
        IMP lastImp = NULL;
        SEL lastSel = NULL;
        
        Method method = methodList[methodCount-1]; // 直接找到最后一个方法，因为我们已经知道了方法列表中分类的方法在主类方法的前面。
        NSString *methodName = [NSString stringWithCString:sel_getName(method_getName(method))
                                                  encoding:NSUTF8StringEncoding]; // 方法名
        if ([@"printName" isEqualToString:methodName]) {// 找到我们需要找的方法，得到方法实现的指针和方法名的指针
            lastImp = method_getImplementation(method);
            lastSel = method_getName(method);
        }
        
        typedef void (*fn)(id,SEL); // 定义一个函数
        
        if (lastImp != NULL) {
            fn f = (fn)lastImp;
            f(my,lastSel); // 执行找到的主类的方法，打印的是myClass
        }
        free(methodList);
    }
```
**这里需要注意的一点就是：虽然可以这么做，但是最好不要用分类覆盖主类的方法，如果真的有这种需求，应该选择创建子类。现在去分类中看的话可以看到`category is implementing a method which will also be implemented by its primary class`这个警告，分类中的这个方法主类已经实现了，所以是不推荐这么做的。**

## 四、参考链接
* [Objective-C Category 的实现原理](http://blog.leichunfeng.com/blog/2015/05/18/objective-c-category-implementation-principle/)
* [深入理解Objective-C：Category](http://tech.meituan.com/DiveIntoCategory.html)
* [Objective-C 中的元类（meta class）是什么？](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&ved=0ahUKEwjEh-HltMfSAhXLiFQKHW0QB-EQFggaMAA&url=http%3A%2F%2Fios.jobbole.com%2F81657%2F&usg=AFQjCNF1YjPaxwmESdhd4A3RMOoatcJpCw&sig2=XfnhX-25WbwbtXEeaaG6Yw&cad=rja)
* [《Objective-C 对象模型》](http://blog.leichunfeng.com/blog/2015/04/25/objective-c-object-model/)