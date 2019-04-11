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


            const filterString = `&filtersBy={"category_id":"${this.gCategoryId}"}`;
            let ajaxUrl = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&is_facets=1&catalog_id=${this.gCatalogId}${filterString}&pageNumber=${this.pageNumber}&pageSize=${this.pageSize}&sortField=${this.sortField}&sortOrder=${this.sortOrder}`;
            ajaxUrl = encodeURI(ajaxUrl);

            this.search(ajaxUrl).then(res => {
                this.changeSort();
                //this._initFacets(res);
                this._initProducts(res);

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
                        this.search(ajaxUrl).then(res => {
                            //this._initFacets(res);
                            this._initProducts(res);
                        });
                    }
                });

            });
        } else {
            $('#product-listing-container').show();
        }
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
            this.search(ajaxUrl).then(res => {
                //this._initFacets(res);
                this._initProducts(res);
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
            const product_rating = parseInt(prods[i].reviews_rating_sum);
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
            if (this.gRoleId == "0") {
                card_action = `<a href="${prods[i].product_url}" class="button button--primary">View Detail</a>`;
            } else {
                card_action = `<a href="/cart.php?action=add&amp;product_id=${prods[i].product_id}" data-event-type="product-click" class="button button--primary">Add to Cart</a>`;
            }
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
            console.log(ajaxUrl2);
            ajaxUrl2 = encodeURI(ajaxUrl2);
            console.log(ajaxUrl2);
            this.search(ajaxUrl2).then(res => {
                console.log(res);

                //this._initFacets(res);
                this._initProducts(res);

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
            console.log(ajaxUrl2);
            ajaxUrl2 = encodeURI(ajaxUrl2);
            console.log(ajaxUrl2);
            this.search(ajaxUrl2).then(res => {
                console.log(res);

                //this._initFacets(res);
                this._initProducts(res);

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
                        this.search(ajaxUrl).then(res => {
                            //this._initFacets(res);
                            this._initProducts(res);
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