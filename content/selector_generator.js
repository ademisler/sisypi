// Bu dosya, bir HTML elementi için CSS seçicisi üreten bir fonksiyon içerir.
// Bu fonksiyon, content_script.js tarafından kullanılabilir hale getirilir.

function generateCssSelector(el) {
    if (!(el instanceof Element)) return;
    
    // 1. ID varsa ve benzersizse, onu kullan (en iyi yöntem)
    if (el.id) {
        // CSS seçicilerinde ID'ler rakamla başlayamaz veya özel karakterler içeremez.
        // Bu yüzden attribute selector kullanmak daha güvenli.
        const idSelector = `[id="${el.id}"]`;
        try {
            if (document.querySelectorAll(idSelector).length === 1) {
                return idSelector;
            }
        } catch (e) {
            // Geçersiz ID...
        }
    }

    // 2. Yolu oluştur (body'e kadar)
    const path = [];
    let currentEl = el;
    while (currentEl && currentEl.nodeType === Node.ELEMENT_NODE) {
        let selector = currentEl.nodeName.toLowerCase();
        if (currentEl === el && el.id) {
            selector += `[id="${el.id}"]`;
        } else {
             // Kardeşler arasında kaçıncı olduğunu ekle (daha kararlı yapar)
            let sibling = currentEl;
            let nth = 1;
            while ((sibling = sibling.previousElementSibling)) {
                if (sibling.nodeName.toLowerCase() === selector.split('[')[0]) {
                    nth++;
                }
            }
            if (currentEl.parentElement && currentEl.parentElement.querySelectorAll(selector.split('[')[0]).length > 1) {
                 selector += `:nth-of-type(${nth})`;
            }
        }
        
        path.unshift(selector);

        // body'e ulaştıysak dur
        if (selector.startsWith('body')) break;
        
        currentEl = currentEl.parentElement;
    }
    return path.join(' > ');
}