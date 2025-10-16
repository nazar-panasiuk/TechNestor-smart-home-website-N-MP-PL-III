/**
 * products [{
 *   title,
 *   description,
 *   price,
 *   image,
 * }]
 */

function initStore(products) {
    const ELEMENTS = {
        favoriteProductsCounter: 'favoriteProductsCounter',
        cartItemsCounter: 'cartItemsCounter',

        catalogItems: 'catalogItems',
        catalogItemTemplate: 'catalogItemTemplate',

        favoriteItems: 'favoriteItems',
        favoritesItemTemplate: 'favoritesItemTemplate',

        cartItems: 'cartItems',
        cartItemTemplate: 'cartItemTemplate',
        cartTotal: 'cartTotal',
        cartItemTotal: 'cartItemTotal',
        cartItemCount: 'cartItemCount',
        cartItemIncrementCount: 'cartItemIncrementCount',
        cartItemDecrementCount: 'cartItemDecrementCount',
        cartItemRemove: 'cartItemRemove',
        cartEmptyDisabled: 'cartEmptyDisabled',

        itemImage: 'itemImage',
        itemTitle: 'itemTitle',
        itemDescription: 'itemDescription',
        itemPrice: 'itemPrice',
        itemToggleFavorite: 'itemToggleFavorite',
        itemAddToCart: 'itemAddToCart',
        itemLink: 'itemLink',
        itemDiscountPrice: 'itemDiscountPrice',

        productDetails: 'productDetails',
        productDetailsTemplate: 'productDetailsTemplate',
    };

    const ATTRIBUTES = {
        element: 'data-store-el',
        action: 'data-store-action',
        actionArgs: 'data-store-action-args',
    };

    const ACTIONS = {
        addToCart: 'addToCart', // args => id
        removeFromCart: 'removeFromCart', // args => id
        incrementCountInCart: 'incrementCountInCart', // args => id,
        decrementCountInCart: 'decrementCountInCart', // args => id,
        setAmountInCart: 'setAmountInCart', // args => { id, amount }
        toggleFavorite: 'toggleFavorite',
    };

    const STORAGE_KEYS = {
        state: 'app.state',
    };

    /**
     * favorites => number => product ids
     * cart items => { id: number, count: number }
     */
    const state = readFromStorage(STORAGE_KEYS.state, {
        cartItems: [],
        favorites: [],
    });

    setupHandlers();
    renderIfPossible();

    /**
     * setup listeners
     * read data from storage
     * render what's possible (template & outlet are available)
     */

    function setupHandlers() {
        window.addEventListener('click', (event) => {
            const actionElement = event.target.closest(
                `[${ATTRIBUTES.action}]`,
            );

            if (!actionElement) return;

            const action = actionElement.getAttribute(ATTRIBUTES.action);
            const actionArgs = actionElement.getAttribute(
                ATTRIBUTES.actionArgs,
            );

            const args = actionArgs ? JSON.parse(actionArgs) : null;

            switch (action) {
                case ACTIONS.toggleFavorite:
                    toggleFavorites(args);
                    break;
                case ACTIONS.addToCart:
                    addToCart(args);
                    break;
                case ACTIONS.removeFromCart:
                    removeFromCart(args);
                    break;
                case ACTIONS.incrementCountInCart:
                    incrementAmountInCart(args);
                    break;
                case ACTIONS.decrementCountInCart:
                    decrementAmountInCart(args);
                    break;
                default:
                    console.log('Unknown action');
            }

            storeState();
            renderIfPossible();
        });
    }

    function toggleFavorites(id) {
        state.favorites = state.favorites.includes(id)
            ? state.favorites.filter((itemId) => itemId !== id)
            : [...state.favorites, id];
    }

    function addToCart(id) {
        state.cartItems = state.cartItems.find((item) => item.id === id)
            ? state.cartItems.map((item) =>
                  item.id === id ? { ...item, count: item.count + 1 } : item,
              )
            : [...state.cartItems, { id, count: 1 }];
    }

    function removeFromCart(id) {
        state.cartItems = state.cartItems.filter((item) => item.id !== id);
    }

    function incrementAmountInCart(id) {
        state.cartItems = state.cartItems.map((item) =>
            item.id === id ? { ...item, count: item.count + 1 } : item,
        );
    }

    function decrementAmountInCart(id) {
        state.cartItems = state.cartItems.map((item) =>
            item.id === id
                ? { ...item, count: Math.max(item.count - 1, 1) }
                : item,
        );
    }

    function storeState() {
        writeIntoStorage(STORAGE_KEYS.state, state);
    }

    function getCartItems() {
        return state.cartItems
            .map((cartItem) => {
                const product = products.find(
                    (product) => product.id === cartItem.id,
                );

                return product ? { product, count: cartItem.count } : null;
            })
            .filter(Boolean);
    }

    function getCartTotal() {
        return getCartItems().reduce(
            (total, { product, count }) => total + product.price * count,
            0,
        );
    }

    function renderIfPossible() {
        renderFavoriteProductsCounter();
        renderCartItemsCounter();
        renderCatalogItems();
        renderFavoriteItems();
        renderCart();
        renderProductDetails();
    }

    function renderFavoriteProductsCounter() {
        const el = queryEl(ELEMENTS.favoriteProductsCounter);

        if (el) {
            el.textContent = state.favorites.length;
        }
    }

    function renderCartItemsCounter() {
        const el = queryEl(ELEMENTS.cartItemsCounter);

        if (el) {
            el.textContent = state.cartItems.reduce(
                (total, cartItem) => total + cartItem.count,
                0,
            );
        }
    }

    function renderCatalogItems() {
        const catalogItemsEl = queryEl(ELEMENTS.catalogItems);
        const catalogItemTemplateEl = queryEl(ELEMENTS.catalogItemTemplate);

        if (!catalogItemsEl || !catalogItemTemplateEl) {
            return;
        }

        const catalogItemsFragment = document.createDocumentFragment();

        products.forEach((product) => {
            const { content: catalogItemEl } =
                catalogItemTemplateEl.cloneNode(true);

            renderItem(product, catalogItemEl);

            catalogItemsFragment.appendChild(catalogItemEl);
        });

        catalogItemsEl.innerHTML = '';
        catalogItemsEl.appendChild(catalogItemsFragment);
    }

    function renderFavoriteItems() {
        const favoriteItemsEl = queryEl(ELEMENTS.favoriteItems);
        const favoritesItemTemplateEl = queryEl(ELEMENTS.favoritesItemTemplate);

        if (!favoriteItemsEl || !favoritesItemTemplateEl) {
            return;
        }

        const favoriteItemsFragment = document.createDocumentFragment();

        products
            .filter((product) => state.favorites.includes(product.id))
            .forEach((product) => {
                const { content: favoritesItemEl } =
                    favoritesItemTemplateEl.cloneNode(true);

                renderItem(product, favoritesItemEl);

                favoriteItemsFragment.appendChild(favoritesItemEl);
            });

        favoriteItemsEl.innerHTML = '';
        favoriteItemsEl.appendChild(favoriteItemsFragment);
    }

    function renderCart() {
        const cartTotalEl = queryEl(ELEMENTS.cartTotal);

        if (cartTotalEl) {
            cartTotalEl.textContent = getCartTotal();
        }

        const cartEmptyDisabled = queryEl(ELEMENTS.cartEmptyDisabled);
        if (cartEmptyDisabled && !state.cartItems.length) {
            cartEmptyDisabled.disabled = true;
        }

        const cartEl = queryEl(ELEMENTS.cartItems);
        const cartItemTemplateEl = queryEl(ELEMENTS.cartItemTemplate);

        if (!cartEl || !cartItemTemplateEl) {
            return;
        }

        const cartItemsFragment = document.createDocumentFragment();

        getCartItems().forEach(({ product, count }) => {
            const { content: cartItemEl } = cartItemTemplateEl.cloneNode(true);

            renderItem(product, cartItemEl);

            const cartItemCount = queryEl(ELEMENTS.cartItemCount, cartItemEl);
            const cartItemTotal = queryEl(ELEMENTS.cartItemTotal, cartItemEl);
            const cartItemRemove = queryEl(ELEMENTS.cartItemRemove, cartItemEl);
            const cartItemIncrementCount = queryEl(
                ELEMENTS.cartItemIncrementCount,
                cartItemEl,
            );
            const cartItemDecrementCount = queryEl(
                ELEMENTS.cartItemDecrementCount,
                cartItemEl,
            );

            if (cartItemCount) {
                cartItemCount.value = count;
            }

            if (cartItemTotal) {
                cartItemTotal.textContent = count * product.price;
            }

            if (cartItemIncrementCount) {
                cartItemIncrementCount.setAttribute(
                    ATTRIBUTES.action,
                    ACTIONS.incrementCountInCart,
                );
                cartItemIncrementCount.setAttribute(
                    ATTRIBUTES.actionArgs,
                    product.id.toString(),
                );
            }

            if (cartItemDecrementCount) {
                cartItemDecrementCount.setAttribute(
                    ATTRIBUTES.action,
                    ACTIONS.decrementCountInCart,
                );
                cartItemDecrementCount.setAttribute(
                    ATTRIBUTES.actionArgs,
                    product.id.toString(),
                );
            }

            if (cartItemRemove) {
                cartItemRemove.setAttribute(
                    ATTRIBUTES.action,
                    ACTIONS.removeFromCart,
                ),
                    cartItemRemove.setAttribute(
                        ATTRIBUTES.actionArgs,
                        product.id.toString(),
                    );
            }

            cartItemsFragment.appendChild(cartItemEl);
        });

        cartEl.innerHTML = '';
        cartEl.appendChild(cartItemsFragment);
    }

    function renderProductDetails() {
        const productDetailsEl = queryEl(ELEMENTS.productDetails);
        const productDetailsTemplateEl = queryEl(
            ELEMENTS.productDetailsTemplate,
        );
        const product = products.find(
            (product) =>
                product.id.toString() ===
                new URL(location.href).searchParams.get('productId'),
        );

        if (!productDetailsEl || !productDetailsTemplateEl || !product) {
            return;
        }

        const { content: productDetailsTemplateContent } =
            productDetailsTemplateEl.cloneNode(true);

        renderItem(product, productDetailsTemplateContent);

        productDetailsEl.innerHTML = '';
        productDetailsEl.appendChild(productDetailsTemplateContent);
    }

    function renderItem(product, element) {
        const imageItem = queryEl(ELEMENTS.itemImage, element);
        const itemTitle = queryEl(ELEMENTS.itemTitle, element);
        const itemDescription = queryEl(ELEMENTS.itemDescription, element);
        const itemPrice = queryEl(ELEMENTS.itemPrice, element);
        const itemDiscountPrice = queryEl(ELEMENTS.itemDiscountPrice, element);
        const itemToggleFavorite = queryEl(
            ELEMENTS.itemToggleFavorite,
            element,
        );
        const itemAddToCart = queryEl(ELEMENTS.itemAddToCart, element);
        const itemLink = queryEl(ELEMENTS.itemLink, element);

        if (itemLink) {
            itemLink.href = `/product-details.html?productId=${product.id}`;
        }

        if (imageItem) {
            imageItem.src = product.image;
        }

        if (itemTitle) {
            itemTitle.textContent = product.title;
        }

        if (itemDescription) {
            itemDescription.textContent = product.description;
        }

        if (itemPrice) {
            itemPrice.textContent = product.price;
        }

        if (itemDiscountPrice) {
            itemDiscountPrice.textContent = product.discountPrice;
        }

        if (itemToggleFavorite) {
            itemToggleFavorite.classList.toggle(
                'in-favorites',
                state.favorites.includes(product.id),
            );
            itemToggleFavorite.setAttribute(
                ATTRIBUTES.action,
                ACTIONS.toggleFavorite,
            );
            itemToggleFavorite.setAttribute(
                ATTRIBUTES.actionArgs,
                product.id.toString(),
            );
        }

        if (itemAddToCart) {
            itemAddToCart.setAttribute(ATTRIBUTES.action, ACTIONS.addToCart);
            itemAddToCart.setAttribute(
                ATTRIBUTES.actionArgs,
                product.id.toString(),
            );
        }
    }

    function queryEl(key, parent = document) {
        return parent.querySelector(`[${ATTRIBUTES.element}="${key}"]`);
    }

    function writeIntoStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function readFromStorage(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key)) ?? fallback;
        } catch {
            return fallback;
        }
    }
}
