import $ from 'jquery';
import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import StencilDropDown from './stencil-dropdown';
import config from '../b2b/config';
import pricesStyle from '../b2b/prices-style';

export default function() {
    const TOP_STYLING = 'top: 49px;';
    const $quickSearchResults = $('.quickSearchResults');
    const $quickSearchDiv = $('#quickSearch');
    //const $searchQuery = $('#search_query');
    const $searchQuery = $('#search_query_adv');
    /*const stencilDropDownExtendables = {
        hide: () => {
            $searchQuery.trigger('blur');
        },
        show: (event) => {
            if (sessionStorage.getItem("bundleb2b_user") != "none") {
                const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
                if (bundleb2b_user.role_id == "0" || bundleb2b_user.role_id == "1" || bundleb2b_user.role_id == "2" || bundleb2b_user.role_id == "10") {
                    $("#b2b_search_form").attr('action', '/b2b-search');
                }
            }

            $searchQuery.trigger('focus');
            event.stopPropagation();
        },
    };*/
    /*const stencilDropDown = new StencilDropDown(stencilDropDownExtendables);
    stencilDropDown.bind($('[data-search="quickSearch"]'), $quickSearchDiv, TOP_STYLING);
    stencilDropDownExtendables.onBodyClick = (e, $container) => {
        // If the target element has this data tag or one of it's parents, do not close the search results
        // We have to specify `.modal-background` because of limitations around Foundation Reveal not allowing
        // any modification to the background element.
        if ($(e.target).closest('[data-prevent-quick-search-close], .modal-background').length === 0) {
            stencilDropDown.hide($container);
        }
    };*/

    //for b2b
    if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
        $("#b2b_search_form").attr('action', '/b2b-search');
    }

    // stagger searching for 200ms after last input
    const doSearch = _.debounce((searchQuery) => {
        utils.api.search.search(searchQuery, {
            template: 'search/quick-results'
        }, (err, response) => {
            if (err) {
                return false;
            }

            $quickSearchResults.html(response);
            //handleCatalogProducts();
        });
    }, 200);

    utils.hooks.on('search-quick', (event) => {
        const searchQuery = $(event.currentTarget).val();

        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            // for b2b user
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();

            if (searchQuery.length == 0) {
                $quickSearchResults.html("");
                return;
            }
            doSearch_b2b(searchQuery);
        } else {
            // for non b2b user
            // server will only perform search with at least 3 characters
            if (searchQuery.length < 3) {
                return;
            }

            doSearch(searchQuery);
        }

    });

    // for bundleb2b
    if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
        $(".quickSearchResults").addClass("b2b-products");

        $('.snize-ac-results').css("display", "none");

        $searchQuery.on('focus', event => {
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
            $(event.currentTarget).parents("form").attr('action', '/b2b-search');
        });

        $searchQuery.unbind('keydown').bind('keydown', function(e) {
            const key = e.which;
            if (key == 13) {
                console.log("key enter");
                e.preventDefault();
                $quickSearchDiv.find("form").submit();
                $(e.currentTarget).parents("form").submit();
            }

            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
        });
        $searchQuery.on('keyup', function(e) {
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
        });
    }

    // Catch the submission of the quick-search
    $quickSearchDiv.on('submit', event => {
        const searchQuery = $(event.currentTarget).find('input').val();
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            // for b2b user
            $('.snize-ac-results').css("display", "none");
            $('.snize-ac-results').remove();
            if (searchQuery.length == 0) {
                $quickSearchResults.html("");
                return event.preventDefault();
            }
            doSearch_b2b(searchQuery);
            return event.preventDefault();
        } else {
            // for non b2b user
            // server will only perform search with at least 3 characters
            if (searchQuery.length === 0) {
                return event.preventDefault();
            }
            return true;
        }
    });

    // for bundleb2b
    const handleCatalogProducts = function() {

        if (sessionStorage.getItem("catalog_products")) {
            const catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));
            const products = $(".quickSearchResults .product");

            for (var product_id in catalog_products) {

                const productSelector = `[catalog-product-${product_id}]`;
                if ($(`${productSelector}`).length > 0) {

                    $(`${productSelector}`).attr("catalog-product", "true");

                    let base_price = $(`${productSelector}`).find(".price.price--withTax").text().replace("$", "").replace(",", "") || $(`${productSelector}`).find(".price.price--withoutTax").text().replace("$", "").replace(",", "");
                    let tier_price;
                    let catalog_price;
                    const variantArr = catalog_products[product_id] || [];
                    if (variantArr.length == 1) {
                        tier_price = variantArr[0].tier_price || [];
                        catalog_price = getCatalogPrice(base_price, tier_price, 1);
                    }
                    if (catalog_price) {
                        $(`${productSelector}`).find(".price.price--withoutTax").text("$" + parseFloat(catalog_price).toFixed(2));
                        $(`${productSelector}`).find(".price.price--withTax").text("$" + parseFloat(catalog_price).toFixed(2));
                    }
                }
            }

            //product Gallery, for listing page
            const $productGallery = $(".quickSearchResults [b2b-products-gallery]");
            $productGallery.each(function() {
                const catalogProductCount = $(this).find("[catalog-product]").length;
                if (catalogProductCount == 0) {

                    $(this).parents(".quickSearchResults").html(`<p class="quickSearchMessage">0 product results for 'oiy'</p>`);
                } else {

                    const $catalogProductCounter = $("[data-catalog-product-counter]");
                    if ($catalogProductCounter.length > 0) {
                        $catalogProductCounter.text(catalogProductCount);
                    }
                }
            });
        } else {
            $(".quickSearchResults .product").css("display", "inline-block");
        }

    };

    // for bundleb2b
    const getCatalogPrice = function(base_price, tier_price_array, qty) {
        //let tier_price = base_price;
        let tier_price = base_price;

        for (let j = 0; j < tier_price_array.length; j++) {
            const type = tier_price_array[j].type;
            const base_qty = tier_price_array[j].qty;
            const price = tier_price_array[j].price;

            if (qty >= base_qty) {
                if (type == "fixed") {
                    tier_price = price;

                } else {
                    tier_price = base_price - base_price * price / 100;
                }
            }
        }
        return tier_price;
    }

    // for bundleb2b
    const b2b_search = function(url, _callback) {
        let promise = new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: url,
                success: function(data) {
                    if (data.code == 200) {
                        resolve(data.response)
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                }
            })
        });
        return promise;
    };

    // for bundleb2b
    const doSearch_b2b = _.debounce((searchQuery) => {
        let gCatalogId;
        const b2bUserInfo = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
        if (b2bUserInfo.catalog_id) {
            gCatalogId = b2bUserInfo.catalog_id;
        }
        if (sessionStorage.getItem("catalog_id")) {
            gCatalogId = sessionStorage.getItem("catalog_id");
        }
        const catalog_products = JSON.parse(sessionStorage.getItem("catalog_products"));

        const searchResultsCount = 5;
        const searchUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&keywords=${searchQuery}&is_facets=0&catalog_id=${gCatalogId}&pageNumber=1&pageSize=${searchResultsCount}`;
        b2b_search(searchUrl).then(res => {
            console.log(res);
            console.log(res.payload);

            let productsLis = "";
            const products = res.payload;
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const product_id = product.product_id;
                let psku = "";
                if (product.base_sku) {
                    psku = `SKU: ${product.base_sku}`;
                }

                let catalog_price = product.base_price;
                const variantArr = catalog_products[product_id] || [];
                if (variantArr.length == 1) {
                    const tier_price = variantArr[0].tier_price || [];
                    catalog_price = getCatalogPrice(product.base_price, tier_price, 1);
                }

                productsLis += `<li class="b2b-results-item"><a href="${product.product_url}">
                                    <span class="b2b-results-thumbnail"><img src="${product.primary_image.thumbnail_url}" alt="${product.product_name}" /></span>
                                    <span class="b2b-results-content">
                                    <span class="b2b-results-pname">${product.product_name}</span>
                                    <span class="b2b-results-psku">${psku}</span>
                                    <span class="b2b-results-pprice">$${pricesStyle(catalog_price,2)}</span>
                                    </span>
                                    </a></li>`;
            }

            if (res.total_count > products.length) {
                productsLis += `<li class="b2b-results-item b2b-results-item--viewall" b2b-search-view-all>
                                    <a href="javascript:void(0);">View all ${res.total_count} items</a>
                                    </li>`;
            }
            /*if (res.total_count == 0) {
                productsLis += `<li class="b2b-results-item b2b-results-item--noresult">
                                    <span>Sorry, nothing found for ${searchQuery}</span>
                                    </li>`;
            }*/

            $quickSearchResults.html(`<div class="b2b-quick-results"><ul>${productsLis}</ul></div>`);

            $("[b2b-search-view-all]").unbind().bind('click', function() {
                $quickSearchDiv.find("form").submit();
            });
        });
    }, 200);

}