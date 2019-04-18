import {
    hooks
} from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';

import config from './b2b/config';
import './b2b/tools/jqPaginator.js';
import pricesStyle from './b2b/prices-style';
import utils from '@bigcommerce/stencil-utils';

export default class Category extends CatalogPage {
    onReady() {
        compareProducts(this.context.urls);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        // for bundleb2b
        this.gCatalogId;
        this.gRoleId;
        this.gCategoryId = this.context.categoryId;
        this.gCatalogProducts;
        this.selectedFacets = {};
        this.pageSize = 30;
        this.pageNumber = 1;
        this.sortField = 'updated_date.keyword';
        this.sortOrder = 'asc';
        this.initB2bFeature();
    }

    // for bundleb2b
    initB2bFeature_o() {
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            $("#product-listing-container .productGrid").empty();
            $(".pagination").hide();

            if (sessionStorage.getItem("catalog_id")) {
                $("#product-listing-container").append(`<div class="pagination">
                <ul class="pagination-list" id="jqPagination"></ul>
                </div>`);
                this.getAllProductsApi();
            } else {
                $(".catalog-listing-wrap").html("We can't find products matching the selection.");
            }
        }
    }
    initB2bFeature() {
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            const b2bUserInfo = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
            this.gRoleId = b2bUserInfo.role_id;
            if (b2bUserInfo.catalog_id) {
                this.gCatalogId = b2bUserInfo.catalog_id;
            }
            if (sessionStorage.getItem("catalog_id")) {
                this.gCatalogId = sessionStorage.getItem("catalog_id");
            }

            this.gCatalogProducts = JSON.parse(sessionStorage.getItem("catalog_products") || "{}");

            /*$(".page").addClass("b2b-search-page").html(`<aside class="page-sidebar-b2b" id="faceted-search-container-b2b">
                <div class="page-sidebar-inner" id="product-filters-container">
                </div>
            </aside>
            <section class="page-content">
                <div id="b2b_search_result">
                    <ul class="productGrid">
                        <li></li>
                    </ul>
                    <ul class="pagination-list" id="jqPagination"></ul>

                </div>
            </scetion>`);*/
            $(".page").addClass("b2b-search-page").find("#product-listing-container").show().html(`
                <section class="page-content">
                    <div id="b2b_search_result" style="margin-bottom:40px;">
                        <ul class="productList">
                        </ul>
                        <ul class="pagination-list" id="jqPagination"></ul>

                    </div>
                </scetion>
            `);

            $("body").append(`<div class="b2b-loading-overlay" id="b2b_loading_overlay">` +
			    `<img src="data:image/gif;base64,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lxogusTFxoq8wMrLsCLHz9C6yczU1Zgn0dnapdPW3t7D2+Ljht3f58sKD+Ts4+bo8L4G7fTZ7/H4rgOj9f3F9/kCbirgr2AugAITWmpgsKEqhAoj2tngsKIpiBITarDIEVLGj5c6ikQGsqSkASNTljNZkqLKl6tYgmQIUyVGmecI1kx5E6e1fTt5+ow4IqjQoQLVGR3ZE6mycEs7NnXqy1lUkVOpwpp3FavWcwOgduWY9aumAAgkjGVqVlkEAkP/RK09aikGgbt48+odgqCv37+ARRwYTLiwYRAJEitezDjE3MeQI0ueTLmy5cuYM2vezLmz58+gQ4seTbq06dOoU6tezbq169ewY8ueTbu27du4c+vezbu379/AgwsfTry48ePIkytfzry58+fQo0ufTr269evYs2vfzr279+/gw4sfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEM1Ro4YUYZqhhgHV06OGHIIYoIocilmiihySeqOKHRaS44ootAvjijDH+N+OLNfp344ouuLijiEn4+COIQco4ZIlF2ngk/5BCLlkHDk0uuUWUR05ppJMfWqkklh5qqSOXHjJB5ZA9jPljmVeCieaWapq5IxBu3ghnmlzOyWadcc4IRp4vysDnin7SiWWgdw76p4poHHpiDoqayKigTj5aaKSNlghFpSKmgGmImkK6ZKeTfropiDCM+mGpnh6JaqiqmuphG652eEOsdcya6pC2soorrU/Q2oKvwN7646/C7qgErUIgq2yxNybL7IxY0LqDtNQ++2IZtHqQ7bbWrqhttypiQCsE45YL7onknmviBLRe0O676pbobrwi1kJviAKCiWKARehLg4BH6HuEgDLoS+h/LehLLIAMBMFlEAwMmAaXaRBYgDcLTrqg04BNONnEgVocqUWCKfwIKoJN9LsiDR8zuAALDpdoAwsLQMiAEjLosEQdS+gghxIRJxgIACH5BAUKAHcALFoA7gAUAYUAAAf/gHeCg4SFhoeIiYqLjI2Oj5CRkpOIDACUmJmam5ydnp+gnxYBDhyhp6ipqqusrYQVdrEoHa61tre4uZ0Xsb0BRhS6wsPExawADr3KChOXxs/Q0dKIJcrWdhsr09vc3bYPCtfXJhbe5ufomRDi4gEiAunx8vODCQHs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" alt=""></div>`);
            const filterString = `&filtersBy={"category_id":"${this.gCategoryId}"}`;
            if(this.context.subcategories && this.context.subcategories.length > 0) {
                this.getAllCategoriesProducts();
            } else {
                let ajaxUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}${filterString}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
                ajaxUrl = encodeURI(ajaxUrl);
                $("#b2b_loading_overlay").show();
                this.search(ajaxUrl).then(res => {
                    this.changeSort();
                    //this._initFacets(res);
                    this._initProducts(res);
                    $("#b2b_loading_overlay").hide();
                    if (res.total_count == 0) {
                        $("#jqPagination").html("");
                        $(".page-sidebar-b2b").remove();
                        return;
                    }

                    $("#jqPagination").jqPaginator({
                        totalPages: Math.ceil(res.total_count / this.pageSize),
                        visiblePages: 5,
                        currentPage: this.pageNumber,
                        onPageChange: (num, type) => {
                            if (this.pageNumber == num) return;
                            this.pageNumber = num;
                            let ajaxUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
                            $("#b2b_loading_overlay").show();
                            this.search(ajaxUrl).then(res => {
                                //this._initFacets(res);
                                this._initProducts(res);
                                $("#b2b_loading_overlay").hide();
                            });
                        }
                    });
                });
            }
        } else {
            $('#product-listing-container').show();
        }
    }

    getAllCategoriesProducts() {
        let categoryUrl = `${config.apiRootUrl}/getChildrenCategoryByParentIdByFront?store_hash=${config.storeHash}&id=${this.gCatalogId}&parent_id=${this.gCategoryId}`;
        this.getChildrenCategory(categoryUrl).then(res=> {
            let categoriesId = [];
            let tempString = '';
            let count = 1;
            for(let i in res) {
                if(i == res.length - 1) {
                    tempString += (res[i].category_id);
                    break;
                }
                tempString += (res[i].category_id + '|');
            }

            const params = {
                store_hash: `${config.storeHash}`,
                is_facets: 1,
                catalog_id: `${this.gCatalogId}`,
                filtersBy: `{\"category_id\":\"` + tempString + `\"}`,
                pageNumber: `${this.pageNumber}`,
                pageSize: `${this.pageSize}`,
                sortField: `${this.sortField}`,
                sortOrder: `${this.sortOrder}`
            }
            this.searchPost(`${config.apiRootUrl}/search`, params).then(res => {
                this.changeSort();
                this._initProducts(res);
                $("#b2b_loading_overlay").hide();
                if (res.total_count == 0) {
                    $("#jqPagination").html("");
                    $(".page-sidebar-b2b").remove();
                    return;
                }

                $("#jqPagination").jqPaginator({
                    totalPages: Math.ceil(res.total_count / this.pageSize),
                    visiblePages: 5,
                    currentPage: this.pageNumber,
                    onPageChange: (num, type) => {
                        if (this.pageNumber == num) return;
                        this.pageNumber = num;
                        let ajaxUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
                        $("#b2b_loading_overlay").show();
                        this.search(ajaxUrl).then(res => {
                            //this._initFacets(res);
                            this._initProducts(res);
                            $("#b2b_loading_overlay").hide();
                        });
                    }
                });
            });
        })
    }

    // for bundleb2b
    renderTable(start, end, categoryProducts) {
        let productsHtml = "";
        for (let j = start; j < end; j++) {
            const product = categoryProducts[j];
            const product_id = product.product_id;
            productsHtml += `<li class="product">
                            <article class="card">
                                <figure class="card-figure">
                                        <a href="${product.product_url}">
                                            <div class="card-img-container">
                                                <img class="card-image" src="${product.primary_image.standard_url}" alt="" title="">
                                            </div>
                                        </a>
                                    <figcaption class="card-figcaption">
                                        <div class="card-figcaption-body">
                                                        <a href="#" class="button button--small card-figcaption-button quickview" data-product-id="${product.product_id}">Quick view</a>
                                                <label class="button button--small card-figcaption-button" for="compare-${product.product_id}">
                                                    Compare <input type="checkbox" name="products[]" value="${product.product_id}" id="compare-${product.product_id}" data-compare-id="${product.product_id}">
                                                </label>
                                        </div>
                                    </figcaption>
                                </figure>
                                <div class="card-body">
                                    <h4 class="card-title">
                                            <a href="${product.product_url}">${product.product_name}</a>
                                    </h4>

                                    <div class="card-text" data-test-info-type="price">

                                    <div class="price-section price-section--withoutTax rrp-price--withoutTax" style="display: none;">
                                        MSRP:
                                        <span data-product-rrp-price-without-tax="" class="price price--rrp">

                                        </span>
                                    </div>
                                    <div class="price-section price-section--withoutTax non-sale-price--withoutTax" style="display: none;">
                                        Was:
                                        <span data-product-non-sale-price-without-tax="" class="price price--non-sale">

                                        </span>
                                    </div>
                                    <div class="price-section price-section--withoutTax">
                                        <span class="price-label">

                                        </span>
                                        <span class="price-now-label" style="display: none;">
                                            Now:
                                        </span>
                                        <span data-product-price-without-tax="" class="price price--withoutTax">$${product.base_price}</span>
                                    </div>
                                    </div>
                                        </div>
                            </article>
                        </li>`;

        }

        $("#product-listing-container .productList").html(productsHtml);

    }

    // for bundleb2b
    getAllProductsApi() {
        const categoryId = this.context.categoryId;
        const catalogId = sessionStorage.getItem("catalog_id");
        const catalogProducts = JSON.parse(sessionStorage.getItem("catalog_products") || "{}");
        let categoryProducts = [];
        //url = `https://fl4mq0bm40.execute-api.us-west-2.amazonaws.com/prod/categoryproducts?id=7120300914635706856&category_id=43`;
        $.ajax({
            type: "GET",
            url: `${config.apiRootUrl}/categoryproducts?id=${catalogId}&category_id=${categoryId}`,
            success: (data) => {
                console.log("category products", data);
                if (data && data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        if (catalogProducts[data[i].product_id]) {
                            categoryProducts.push(data[i]);
                        }
                    }

                    const productsPerPage = this.context.categoryProductsPerPage;
                    const productsNum = categoryProducts.length;
                    const totalPage = Math.ceil(productsNum / productsPerPage);
                    if (productsNum > productsPerPage) {
                        $("#jqPagination").jqPaginator({
                            totalPages: totalPage,
                            visiblePages: 10,
                            currentPage: 1,
                            onPageChange: (num, type) => {
                                const start = (num - 1) * productsPerPage;
                                const end = (num * productsPerPage > productsNum) ? productsNum : num * productsPerPage;
                                this.renderTable(start, end, categoryProducts);
                            }
                        });
                    } else {
                        this.renderTable(0, productsNum, categoryProducts);
                        //$("#jqPagination").jqPaginator('destroy');
                        $("#jqPagination").html("");
                    }

                }



            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("error", JSON.stringify(jqXHR));
            }
        });
    }

    // for bundleb2b
    getAllProducts() {


        const paginations = this.context.paginationCategory || [];
        if (paginations) {

            for (let i = 1; i < paginations.length; i++) {

                const formatUrl = paginations[i].url;

                const productsPerPage = this.context.categoryProductsPerPage;

                const requestOptions = {
                    config: {
                        category: {
                            shop_by_price: true,
                            products: {
                                limit: productsPerPage,
                            },
                        },
                    },
                    template: 'b2b/catalog-product-listing'


                };
                api.getPage(formatUrl, requestOptions, (err, content) => {

                    const $listing = $(content);

                    if (err) {
                        throw new Error(err);
                    }

                    // Refresh view with new content
                    console.log($listing);
                });

            }

        }


    }

    initFacetedSearch() {
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('html, body').animate({
                scrollTop: 0,
            }, 100);

            this.initB2bFeature();
        });
    }

    search(url, _callback) {
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

    searchPost(url, params, _callback) {
        let promise = new Promise((resolve, reject) => {
            $.ajax({
                type: 'post',
                contentType: "application/json",
                data: JSON.stringify(params),
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

    getChildrenCategory(url, _callback) {
        let promise = new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: url,
                success: function(data) {
                    if (data && data.length > 0) {
                        resolve(data)
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                }
            })
        });
        return promise;
    };

    changeSort() {
        let result = $("#b2b_search_result");
        let sort = `<fieldset class="form-fieldset actionBar-section" style="width: 210px; float: none;">
                        <div class="form-field">
                            <label class="form-label" for="sort">Sort By:</label>
                            <select class="form-select form-select--small" name="sort" id="sort">
                                <option value="updated_date.keyword" data-sort="asc" selected="">Featured Items</option>
                                <option value="updated_date.keyword" data-sort="desc">Newest Items</option>` +
            // <option value="bestselling" >Best Selling</option>
            `<option value="product_name.keyword" data-sort="asc">A to Z</option>
                                <option value="product_name.keyword" data-sort="desc">Z to A</option>` +
            // <option value="avgcustomerreview" >By Review</option>
            `<option value="base_price" data-sort="asc">Price: Ascending</option>
                                <option value="base_price" data-sort="desc">Price: Descending</option>
                            </select>
                        </div>
                    </fieldset>`;
        result.prepend(sort);
        $('#sort').on('change', () => {
            this.sortField = $('#sort').val();
            this.sortOrder = $("#sort").find("option:selected").data("sort");
            let ajaxUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
            $("#b2b_loading_overlay").show();
            this.search(ajaxUrl).then(res => {
                //this._initFacets(res);
                this._initProducts(res);
                $("#b2b_loading_overlay").hide();
            });
        })
    }

    _initProducts(res) {
        //let ul = $("#b2b_search_result").find(".productGrid");
        let ul = $("#b2b_search_result").find(".productList");
        ul.empty();

        let prods = res.payload;
        if (!prods || prods.length == 0) {
            $("#b2b_search_result").html("There are no products listed under this category.");
            return;
        }


        for (let i in prods) {

            let base_price = prods[i].base_price;
            let tier_price;
            let catalog_price = base_price;
            const product_id = prods[i].product_id;
            const variantArr = this.gCatalogProducts[product_id] || [];
            if (variantArr.length == 1) {
                tier_price = variantArr[0].tier_price || [];
                catalog_price = this.getCatalogPrice(base_price, tier_price, 1);
            }

            let rrp_price = `<span class="b2b-rrp-price">$${pricesStyle(base_price, 2)}</span>`;

            if (base_price == catalog_price) {
                rrp_price = "";
            }

            //catalog_price = parseFloat(catalog_price).toFixed(2);
            catalog_price = pricesStyle(catalog_price, 2);
            console.log("this is catalog_price " + catalog_price);

            // product rating
            const product_rating = prods[i].reviews_count == "0" ? 0 : Math.round(parseInt(prods[i].reviews_rating_sum) / parseInt(prods[i].reviews_count));
            let pro_rating = `<p class="listItem-rating" data-rating="${product_rating}" data-test-info-type="productRating">
                <span class="rating--small">`;

            for (let j = 0; j < 5; j++) {
                if (product_rating > j) {
                    pro_rating += `<span class="icon icon--ratingFull">
                        <svg>
                            <use xlink:href="#icon-star" />
                        </svg>
                    </span>`;
                } else {
                    pro_rating += `<span class="icon icon--ratingEmpty">
                        <svg>
                            <use xlink:href="#icon-star" />
                        </svg>
                    </span>`;
                }
            }
            pro_rating += `</span></p>`;


            let pro_bg_a = `<img class="listItem-image lazyautosizes lazyloaded" data-sizes="auto" src="${prods[i].primary_image.standard_url}" data-src="${prods[i].primary_image.standard_url}" alt="" title="" sizes="263px">`;
            let figcaption = `<div class="listItem-figureBody">` +
                `<a class="button button--small listItem-button quickview" data-product-id="${prods[i].product_id}">Quick view</a>` +
                `</div>`;

            let card_action = ``;
            card_action = `<a href="${prods[i].product_url}" class="button button--primary">View Detail</a>`;
            /*if (this.gRoleId == "0") {
                card_action = `<a href="${prods[i].product_url}" class="button button--primary">View Detail</a>`;
            } else {
                card_action = `<a href="/cart.php?action=add&amp;product_id=${prods[i].product_id}" data-event-type="product-click" class="button button--primary">Add to Cart</a>`;
            }*/
            let card_body = `<div class="listItem-details">${pro_rating}<h4 class="listItem-title"><a href="${prods[i].product_url}">${prods[i].product_name}</a></h4><p data-product-summary-${product_id}></p></div>` +
                `<div class="listItem-actions">` +
                `<div class="listItem-price">` +
                `<div class="price-section price-section--withoutTax">` +
                `<span class="price-label"></span>` +
                `<span class="price-now-label" style="display: none;">Now:</span>` +
                `${rrp_price}<span data-product-price-without-tax="" class="price price--withoutTax">$${pricesStyle(catalog_price,2)}</span>` +
                `</div>` +
                `</div>` +
                `${card_action}` +
                `</div>`;

            ul.append(`<li class="product"><article class="listItem">` +
                `<figure class="listItem-figure">${pro_bg_a}${figcaption}</figure>` +
                `<div class="listItem-body"><div class="listItem-content">${card_body}</div></div>` +
                `</article></li>`);

            this.getProductSummary(product_id, function(summary) {
                //console.log(summary);
                $(`[data-product-summary-${product_id}]`).text(summary);
            });
        }
    }

    _initFacets(res) {
        this.selectedFacets = {};
        const facets = res.facets;

        const $productFiltersContainer = $("#product-filters-container");
        let filterHtml = "";
        let facetsCount = facets.length;
        for (let i = 0; i < facetsCount; i++) {
            const facet = facets[i];

            let facetHtml = "";
            if (facet.attribute !== "category_id") {
                facetHtml = this.getFacetHtml(facet.type_name, facet.buckets, facet.attribute);
            }

            if (facetHtml.trim() != "") {
                filterHtml += `
                <div class="product-filters-block" data-attribute="${facet.attribute}">
                    <div class="product-filters-title open">
                        <h3>${facet.title}</h3>
                        <div class="product-filters-title--toggle">
                            <span class="toggle-open">&plus;</span>
                            <span class="toggle-close">&minus;</span>
                        </div>
                    </div>
                    <ul class="product-filters-list open">
                        ${facetHtml}
                    </ul>
                </div>`;
            }

        }

        $productFiltersContainer.html(filterHtml);
        if (filterHtml.trim() == "") {
            $("#faceted-search-container-b2b").remove();
        }

        console.log(this.selectedFacets);
        this._bindEvents();

    }

    getFacetHtml(type_name, buckets, attribute) {
        let facetHtml = "";

        switch (type_name) {
            case "select":
                facetHtml += "";
                for (let j = 0; j < buckets.length; j++) {
                    const bucket = buckets[j];
                    const bucket_value = bucket.value;
                    const isChecked = bucket.select ? 'checked' : '';
                    if (bucket.count > 0) {
                        facetHtml += `
                        <li>
                            <label data-facet-search data-facet-attribute="${attribute}" data-facet-value="${bucket_value}"><input type="checkbox" value="${bucket.value}" ${isChecked}><span>${bucket.title}</span> <span>(${bucket.count})</span></label>
                        </li>`;

                        if (isChecked) {
                            this.selectedFacets[attribute] = this.selectedFacets[attribute] || [];
                            this.selectedFacets[attribute].push(bucket_value + "");
                        }
                    }
                }
                break;
            case "slider":
                facetHtml += "";
                for (let j = 0; j < buckets.length; j++) {
                    const bucket = buckets[j];
                    const bucket_value = bucket.value;
                    const isChecked = bucket.select ? 'checked' : '';

                    if (bucket.left != 0 || bucket.right != 0) {
                        this.selectedFacets[attribute] = this.selectedFacets[attribute] || [];
                        this.selectedFacets[attribute].push(bucket.left);
                        this.selectedFacets[attribute].push(bucket.right);

                        facetHtml += `<li><a href="javascript:void(0);" class="clear-price-range" data-faceted-search-range="clear">Clear</a><div class="form-minMaxRow">
                            <div class="form-field">
                                <input name="min_price" placeholder="Min." min="0" class="form-input form-input--small" required="" type="number" value="${bucket.left}">
                            </div>

                            <div class="form-field">
                                <input name="max_price" placeholder="Max." min="0" class="form-input form-input--small" required="" type="number" value="${bucket.right}">
                            </div>

                            <div class="form-field">
                                <button class="button button--small" type="button" data-faceted-search-range>
                                    Update
                                </button>
                            </div>
                        </div></li>`;
                    } else {
                        facetHtml += `<li><div class="form-minMaxRow">
                            <div class="form-field">
                                <input name="min_price" placeholder="Min." min="0" class="form-input form-input--small" required="" type="number" value="">
                            </div>

                            <div class="form-field">
                                <input name="max_price" placeholder="Max." min="0" class="form-input form-input--small" required="" type="number" value="">
                            </div>

                            <div class="form-field">
                                <button class="button button--small" type="button" data-faceted-search-range>
                                    Update
                                </button>
                            </div>
                        </div></li>`;

                    }

                }
                break;
            default:

        }
        return facetHtml;

    }

    _bindEvents() {
        $(".product-filters-title").unbind().bind('click', function() {
            $(this).toggleClass("open").next('.product-filters-list').toggleClass("open");
        });

        $("[data-facet-search]").unbind().bind('click', (event) => {
            event.preventDefault();
            const $target = $(event.currentTarget);
            console.log("facet click");
            const $inputCheckBox = $target.find('input[type="checkbox"]');
            if ($inputCheckBox.length > 0 && $inputCheckBox.prop("checked") == true) {
                $inputCheckBox.prop("checked", false);

            } else {
                $inputCheckBox.prop("checked", true);

            }
            const facetAttribute = $target.attr('data-facet-attribute');
            const facetValue = $target.attr('data-facet-value');

            if (this.selectedFacets[facetAttribute]) {
                //exist facet
                let value_arr = this.selectedFacets[facetAttribute];
                const value_index = $.inArray(facetValue, value_arr);
                if (value_index == -1) {
                    // new value, add
                    value_arr.push(facetValue);
                } else {
                    // exist value, remove
                    value_arr.splice(value_index, 1);
                }

                // if no values, remove the filter
                if (value_arr.length == 0) {
                    delete this.selectedFacets[facetAttribute];
                }

            } else {
                // new facet
                this.selectedFacets[facetAttribute] = [facetValue];
            }

            let filterString = ""; //filtersBy={"category_id":%20"23|41|39|61"}

            $.each(this.selectedFacets, function(facet, values) {
                const valuesString = values.join("|");
                filterString += `,"${facet}":"${valuesString}"`;
            });

            filterString += `,"category_id":"${this.gCategoryId}"`;

            if (filterString.trim() != "") {
                filterString = filterString.substring(1, filterString.length);
                filterString = "&filtersBy={" + filterString + "}";
            }

            let ajaxUrl2 = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}${filterString}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
            ajaxUrl2 = encodeURI(ajaxUrl2);
            $("#b2b_loading_overlay").show();
            this.search(ajaxUrl2).then(res => {
                //this._initFacets(res);
                this._initProducts(res);
                $("#b2b_loading_overlay").hide();
            });

        });

        $("[data-faceted-search-range]").unbind().bind('click', (event) => {
            this.pageNumber = 1;
            const $target = $(event.currentTarget);
            const $minPrice = $('input[name="min_price"]');
            const $maxPrice = $('input[name="max_price"]');
            const minPriceValue = $minPrice.val();
            const maxPriceValue = $maxPrice.val();
            if (minPriceValue == "" || maxPriceValue == "") {
                return alert("Please enter price range");
            }
            if (minPriceValue == 0 && maxPriceValue == 0) {
                return alert("Please enter price range");
            }
            if (parseInt(minPriceValue) > parseInt(maxPriceValue)) {
                return alert("Min price can't be bigger than Max price");
            }

            if ($target.attr("data-faceted-search-range") == "clear") {
                delete this.selectedFacets["base_price"];
            } else {
                this.selectedFacets["base_price"] = [minPriceValue, maxPriceValue];
            }


            let filterString = ""; //filtersBy={"category_id":%20"23|41|39|61"}

            $.each(this.selectedFacets, function(facet, values) {
                const valuesString = values.join("|");
                filterString += `,"${facet}":"${valuesString}"`;
            });

            filterString += `,"category_id":"${this.gCategoryId}"`;

            if (filterString.trim() != "") {
                filterString = filterString.substring(1, filterString.length);
                filterString = "&filtersBy={" + filterString + "}";
            }

            let ajaxUrl2 = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}${filterString}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
            ajaxUrl2 = encodeURI(ajaxUrl2);
            $("#b2b_loading_overlay").show();
            this.search(ajaxUrl2).then(res => {
                console.log(res);

                //this._initFacets(res);
                this._initProducts(res);
                $("#b2b_loading_overlay").hide();
                if (res.total_count == 0) {
                    $("#jqPagination").html("");
                    //$(".page-sidebar-b2b").remove();
                    return;
                }

                $("#jqPagination").jqPaginator({
                    totalPages: Math.ceil(res.total_count / this.pageSize),
                    visiblePages: 5,
                    currentPage: this.pageNumber,
                    onPageChange: (num, type) => {
                        if (this.pageNumber == num) return;
                        this.pageNumber = num;
                        let ajaxUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}${filterString}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
                        ajaxUrl = encodeURI(ajaxUrl);
                        $("#b2b_loading_overlay").show();
                        this.search(ajaxUrl).then(res => {
                            //this._initFacets(res);
                            this._initProducts(res);
                            $("#b2b_loading_overlay").hide();
                        });
                    }
                });
            });


        });
    }

    getCatalogPrice(base_price, tier_price_array, qty) {
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

    //for bundleb2b
    getProductSummary(productId, _cb) {
        utils.api.product.getById(productId, {
            template: 'b2b/product-description'
        }, (err, response) => {
            const descHtml = $(response).text();

            let textstr = descHtml.replace(/<[^>]*>|/g, "");
            if (textstr.length > 100) {
                textstr = textstr.substring(0, 200);
                const lastBlank = textstr.lastIndexOf(" ") || 0;
                if (textstr.lastIndexOf(" ")) {
                    textstr = textstr.substring(0, lastBlank) + "...";
                }
            }

            if (_cb) {
                _cb(textstr);
            }
        });

    }

}
