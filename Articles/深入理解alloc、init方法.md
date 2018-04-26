本文源码为 [runtime](http://opensource.apple.com/tarballs/objc4/) 中的` objc4-706.tar.gz`。主文引用的源码都可以在runtime文件夹下的`NSObject.h`、`NSObject.mm`、`objc-runtime-new.h`、`objc-runtime-new.mm`找到。下面就参照源码，探究一下它的真面目。

<!-- more -->

## 一、alloc做了什么

可以看到`alloc`方法调用了`_objc_rootAlloc`方法
```oc
+ (id)alloc {
    return _objc_rootAlloc(self);
}
```
而`_objc_rootAlloc`又调用了`callAlloc`方法
```oc
// Base class implementation of +alloc. cls is not nil.
// Calls [cls allocWithZone:nil].
id
_objc_rootAlloc(Class cls)
{
    return callAlloc(cls, false/*checkNil*/, true/*allocWithZone*/);
}
```
看一下`callAlloc`方法的实现
```oc
// Call [cls alloc] or [cls allocWithZone:nil], with appropriate 
// shortcutting optimizations.
static ALWAYS_INLINE id
callAlloc(Class cls, bool checkNil, bool allocWithZone=false)
{
    if (slowpath(checkNil && !cls)) return nil;

#if __OBJC2__
    if (fastpath(!cls->ISA()->hasCustomAWZ())) {
        // No alloc/allocWithZone implementation. Go straight to the allocator.
        // fixme store hasCustomAWZ in the non-meta class and 
        // add it to canAllocFast's summary
        if (fastpath(cls->canAllocFast())) {
            // No ctors, raw isa, etc. Go straight to the metal.
            bool dtor = cls->hasCxxDtor();
            id obj = (id)calloc(1, cls->bits.fastInstanceSize());
            if (slowpath(!obj)) return callBadAllocHandler(cls);
            obj->initInstanceIsa(cls, dtor);
            return obj;
        }
        else {
            // Has ctor or raw isa or something. Use the slower path.
            id obj = class_createInstance(cls, 0);
            if (slowpath(!obj)) return callBadAllocHandler(cls);
            return obj;
        }
    }
#endif

    // No shortcuts available.
    if (allocWithZone) return [cls allocWithZone:nil];
    return [cls alloc];
}
```
第一步，检查`checkNil`以及`cls`，因为传入的`cls`是存在的并且`checkNil`是`false`，所以会继续往下执行。
第二步，判断`hasCustomAWZ( )`
```oc
    bool hasCustomAWZ() {
        return ! bits.hasDefaultAWZ();
    }
```
可以看到`hasCustomAWZ`又调用了`hasDefaultAWZ`。
```oc
#if FAST_HAS_DEFAULT_AWZ
    bool hasDefaultAWZ() {
        return getBit(FAST_HAS_DEFAULT_AWZ);
    }
    void setHasDefaultAWZ() {
        setBits(FAST_HAS_DEFAULT_AWZ);
    }
    void setHasCustomAWZ() {
        clearBits(FAST_HAS_DEFAULT_AWZ);
    }
#else
    bool hasDefaultAWZ() {
        return data()->flags & RW_HAS_DEFAULT_AWZ;
    }
    void setHasDefaultAWZ() {
        data()->setFlags(RW_HAS_DEFAULT_AWZ);
    }
    void setHasCustomAWZ() {
        data()->clearFlags(RW_HAS_DEFAULT_AWZ);
    }
#endif
```
这个方法是用来判断当前`class`是否有默认的`allocWithZone`。返回一个布尔值，为`YES`的话，说明有默认的`allocWithZone`方法，那么就直接对`class`进行`allocWithZone`，申请内存空间。`allocWithZone`的实现后面会详细分析
```oc
 if (allocWithZone) return [cls allocWithZone:nil];
```
如果`hasCustomAWZ`为`NO`的话，说明没有默认的`allocWithZone`方法。
```oc
        // No alloc/allocWithZone implementation. Go straight to the allocator.
        // fixme store hasCustomAWZ in the non-meta class and 
        // add it to canAllocFast's summary
        if (fastpath(cls->canAllocFast())) {
            // No ctors, raw isa, etc. Go straight to the metal.
            bool dtor = cls->hasCxxDtor();
            id obj = (id)calloc(1, cls->bits.fastInstanceSize());
            if (slowpath(!obj)) return callBadAllocHandler(cls);
            obj->initInstanceIsa(cls, dtor);
            return obj;
        }
        else {
            // Has ctor or raw isa or something. Use the slower path.
            id obj = class_createInstance(cls, 0);
            if (slowpath(!obj)) return callBadAllocHandler(cls);
            return obj;
        }
```
继续判断当前的`class`是否支持快速`alloc`。
```oc
    bool canAllocFast() {
        return bits & FAST_ALLOC;
    }
```
如果可以，直接调用`calloc`函数，申请内存空间，后面也会提到`calloc`函数。如果创建失败，也会调用`callBadAllocHandler`函数。如果创建成功，就去初始化`isa`指针和`dtor`。如果当前的`class`不支持快速`alloc`，那么就去调用`class_createInstance(cls, 0)`;方法去创建一个新的对象。

现在开始分析`allocWithZone`这个方法是怎么去创建对象的，`allocWithZone`方法调用了`_objc_rootAllocWithZone`方法
```oc
// Replaced by ObjectAlloc
+ (id)allocWithZone:(struct _NSZone *)zone {
    return _objc_rootAllocWithZone(self, (malloc_zone_t *)zone);
}
```
继续看`_objc_rootAllocWithZone`方法的实现
```oc
id
_objc_rootAllocWithZone(Class cls, malloc_zone_t *zone)
{
    id obj;

#if __OBJC2__
    // allocWithZone under __OBJC2__ ignores the zone parameter
    (void)zone;
    obj = class_createInstance(cls, 0);
#else
    if (!zone) {
        obj = class_createInstance(cls, 0);
    }
    else {
        obj = class_createInstanceFromZone(cls, 0, zone);
    }
#endif

    if (slowpath(!obj)) obj = callBadAllocHandler(cls);
    return obj;
}
```
如果对象创建成功，在OBJC2下，忽略`zone`参数，直接调用`class_createInstance`方法，如果是老版本的话，还要考虑`zone`，不存在的话也是直接调用`class_createInstance`方法，如果存在，会调用`class_createInstanceFromZone`。如果对象创建失败，执行`callBadAllocHandler`方法，输出错误信息。
```oc
id 
class_createInstance(Class cls, size_t extraBytes)
{
    return _class_createInstanceFromZone(cls, extraBytes, nil);
}
```
```oc
id
class_createInstanceFromZone(Class cls, size_t extraBytes, void *zone)
{
    return _class_createInstanceFromZone(cls, extraBytes, zone);
}
```
比较这两个方法可以看到他们都是调用了`_class_createInstanceFromZone`这个方法，也就是说真正的创建对象是在这个方法里完成的，区别就是前者不需要传入`zone`参数。看一下`_class_createInstanceFromZone`这个方法的实现。
```oc
static __attribute__((always_inline)) 
id
_class_createInstanceFromZone(Class cls, size_t extraBytes, void *zone, 
                              bool cxxConstruct = true, 
                              size_t *outAllocatedSize = nil)
{
    if (!cls) return nil;

    assert(cls->isRealized());

    // Read class's info bits all at once for performance
    bool hasCxxCtor = cls->hasCxxCtor();
    bool hasCxxDtor = cls->hasCxxDtor();
    bool fast = cls->canAllocNonpointer();

    size_t size = cls->instanceSize(extraBytes);
    if (outAllocatedSize) *outAllocatedSize = size;

    id obj;
    if (!zone  &&  fast) {
        obj = (id)calloc(1, size);
        if (!obj) return nil;
        obj->initInstanceIsa(cls, hasCxxDtor);
    } 
    else {
        if (zone) {
            obj = (id)malloc_zone_calloc ((malloc_zone_t *)zone, 1, size);
        } else {
            obj = (id)calloc(1, size);
        }
        if (!obj) return nil;

        // Use raw pointer isa on the assumption that they might be 
        // doing something weird with the zone or RR.
        obj->initIsa(cls);
    }

    if (cxxConstruct && hasCxxCtor) {
        obj = _objc_constructOrFree(obj, cls);
    }

    return obj;
}
```
下面看一下`hasCxxCtor `、`hasCxxDtor `、`fast `这三个到底是干嘛的。
```oc
  bool hasCxxCtor() {
        // addSubclass() propagates this flag from the superclass.
        assert(isRealized());
        return bits.hasCxxCtor();
    }
    void setHasCxxCtor() { 
        bits.setHasCxxCtor();
    }

    bool hasCxxDtor() {
        // addSubclass() propagates this flag from the superclass.
        assert(isRealized());
        return bits.hasCxxDtor();
    }
    void setHasCxxDtor() { 
        bits.setHasCxxDtor();
    }
```
其实`hasCxxCtor `和`hasCxxDtor `是对Objective-C++ 的支持，用来判断这个类以及它的父类是否有 C++ 类构造函数和析构函数。
```oc
 bool canAllocNonpointer() {
        assert(!isFuture());
        return !instancesRequireRawIsa();
    }
```
而 `fast`，是对 `isa` 的类型的区分，如果一个类和它父类的实例不能使用`isa_t` 类型的 `isa` 的话，`fast` 就为 `false`，但是在 Objective-C 2.0 中，大部分类都是支持的。
下面调用` size_t size = cls->instanceSize(extraBytes)`获得分配的内存的大小，
```oc
  // May be unaligned depending on class's ivars.
    uint32_t unalignedInstanceSize() {
        assert(isRealized());
        return data()->ro->instanceSize;
    }

    // Class's ivar size rounded up to a pointer-size boundary.
    uint32_t alignedInstanceSize() {
        return word_align(unalignedInstanceSize());
    }

    size_t instanceSize(size_t extraBytes) {
        size_t size = alignedInstanceSize() + extraBytes;
        // CF requires all objects be at least 16 bytes.
        if (size < 16) size = 16;
        return size;
    }
```
可以看到`instanceSize`从 `cls` 的 `ro` 中获得 `instanceSize` 然后将它对齐，并加上 `extraBytes`，存储在类的 `isa_t`结构体中。
因为`NSZone`已经弃用，所以源码里出现的`zone`基本都可以忽略了。调用`calloc`申请空间，可以看到这里的流程跟上面提到的快速`alloc`流程是一样的。申请完空间后在调用`initInstanceIsa `方法初始化。至此`alloc`方法就结束了。

## 二、init做了什么
```oc
- (id)init {
    return _objc_rootInit(self);
}
```
```oc
id
_objc_rootInit(id obj)
{
    // In practice, it will be hard to rely on this function.
    // Many classes do not properly chain -init calls.
    return obj;
}
```
可以看到`init`方法调用了`_objc_rootInit`，而`_objc_rootInit`直接返回了`obj`。

## 三、思考
1. 比较尴尬的是我们都知道**alloc分配存储空间，init初始化**这个“常识”，`init`方法“看起来”什么都没做啊。大部分工作其实`alloc`都做好了！
2. `[[xxx alloc]init]`和`[xxx new]`有什么区别呢？
还是从源码分析这个问题，上面已经知道了`alloc`方法调用了`_objc_rootAlloc`方法，而`_objc_rootAlloc`又调用了`callAlloc`方法

```oc
+ (id)alloc {
    return _objc_rootAlloc(self);
}
```
```oc
// Base class implementation of +alloc. cls is not nil.
// Calls [cls allocWithZone:nil].
id
_objc_rootAlloc(Class cls)
{
    return callAlloc(cls, false/*checkNil*/, true/*allocWithZone*/);
}
```
在`NSObject.mm`可以看到`new`方法的源码，调用了`[callAlloc init]`方法
```oc
+ (id)new {
    return [callAlloc(self, false/*checkNil*/) init];
}
```
前者的`callAlloc`多了一个`allocWithZone`为`true`的参数，而我们知道在Objective-C2.0`zone`参数是无效的了，这意味着`[alloc init]`和`new`是一样的。非要说区别的话是`new`的方式不能自定义初始化方法（initXXX）。
3.调用alloc后内存是直接映射到堆还是只分配给了虚拟内存？
这个问题很有意思，具体可以看这篇[alloc、init你弄懂50%了吗？](http://ios.jobbole.com/86324/)

## 四、参考资料
[Objc 对象的今生今世](https://halfrost.com/objc_life/)
[从 NSObject 的初始化了解 isa](http://draveness.me/isa/)
[alloc、init你弄懂50%了吗？](http://ios.jobbole.com/86324/)