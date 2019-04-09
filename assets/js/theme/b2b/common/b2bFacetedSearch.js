/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2019-03-04 17:21:12
 * @version $Id$
 */

import $ from 'jquery';
import config from '../config';

const bypass_store_hash = `${config.storeHash}`;

class b2bFacetedSearch {
	constructor(requestOptions, callback, options) {
		const defaultOptions = {

		};

		// Private properties
		this.requestOptions = requestOptions;
		this.callback = callback;
		this.options = _.extend({}, defaultOptions, options);
		this.collapsedFacets = [];
		this.collapsedFacetItems = [];



		// Observe user events
		/*this.onStateChange = this.onStateChange.bind(this);
		this.onToggleClick = this.onToggleClick.bind(this);
		this.onAccordionToggle = this.onAccordionToggle.bind(this);
		this.onClearFacet = this.onClearFacet.bind(this);
		this.onFacetClick = this.onFacetClick.bind(this);
		this.onRangeSubmit = this.onRangeSubmit.bind(this);
		this.onSortBySubmit = this.onSortBySubmit.bind(this);
		this.filterFacetItems = this.filterFacetItems.bind(this);*/
		this.onAccordionToggle = this.onAccordionToggle.bind(this);
		this.onClearFacet = this.onClearFacet.bind(this);
		this.onFacetClick = this.onFacetClick.bind(this);

		//this.bindEvents();

	}

	searchApi(url, _callback) {
		let promise = new Promise((resolve, reject) => {
			$.ajax({
				type: 'GET',
				url: url,
				success: function(data) {
					if (data.code == 200) {
						resolve(data.response)
					} else {
						reject();
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.log(JSON.stringify(jqXHR));
				}
			})
		});
		return promise;
	}

	_initProducts(res) {
		let ul = $("#b2b_search_result").find(".productGrid");
		ul.empty();

		let prods = res.payload;
		if (!prods || prods.length == 0) {
			return;
		}


		for (let i in prods) {
			let pro_bg_a = `<a href="${prods[i].product_url}">` +
				`<div class="card-img-container">` +
				`<img class="card-image lazyautosizes lazyloaded" data-sizes="auto" src="${prods[i].primary_image.standard_url}" data-src="${prods[i].primary_image.standard_url}" alt="" title="" sizes="263px">` +
				`</div></a>`;
			let figcaption = `<figcaption class="card-figcaption"><div class="card-figcaption-body">` +
				`<a class="button button--small card-figcaption-button quickview" data-product-id="${prods[i].product_id}">Quick view</a>` +
				`<label class="button button--small card-figcaption-button" for="compare-${prods[i].product_id}">Compare ` +
				`<input type="checkbox" name="products[]" value="${prods[i].product_id}" id="compare-${prods[i].product_id}" data-compare-id="${prods[i].product_id}">` +
				`</label>` +
				`<a href="/cart.php?action=add&product_id=${prods[i].product_id}" data-event-type="product-click" class="button button--small card-figcaption-button">Add to Cart</a>` +
				`</div></figcaption>`;

			let card_body = `<h4 class="card-title"><a href="${prods[i].product_url}">${prods[i].product_name}</a></h4>` +
				`<div class="card-text" data-test-info-type="price">` +
				`<div class="price-section price-section--withoutTax rrp-price--withoutTax">MSRP:` +
				`<span data-product-rrp-price-without-tax="" class="price price--rrp">$22.00</span>` +
				`</div>` +
				`<div class="price-section price-section--withoutTax non-sale-price--withoutTax" style="display: none;">Was:` +
				`<span data-product-non-sale-price-without-tax="" class="price price--non-sale"></span>` +
				`</div>` +
				`<div class="price-section price-section--withoutTax">` +
				`<span class="price-label"></span>` +
				`<span class="price-now-label" style="display: none;">Now:</span>` +
				`<span data-product-price-without-tax="" class="price price--withoutTax">$${prods[i].base_price}</span>` +
				`</div></div>`;
			ul.append(`<li class="product"><article class="card">` +
				`<figure class="card-figure">${pro_bg_a}${figcaption}</figure>` +
				`<div class="card-body">${card_body}</div>` +
				`</article></li>`)
		}
	}

	_initFacets(res) {
		selectedFacets = {};
		const facets = res.facets;

		const $productFiltersContainer = $("#product-filters-container");
		let filterHtml = "";
		let facetsCount = facets.length;
		for (let i = 0; i < facetsCount; i++) {
			const facet = facets[i];
			const facetHtml = getFacetHtml(facet.type_name, facet.buckets, facet.attribute);
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

		console.log(selectedFacets);
		_bindEvents();

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
	                        <label data-facet-search data-facet-attribute="${attribute}" data-facet-value="${bucket_value}"><input type="checkbox" value="${bucket.value}" ${isChecked}><span>${bucket.title}</span> (${bucket.count})</label>
	                    </li>`;

						if (isChecked) {
							selectedFacets[attribute] = selectedFacets[attribute] || [];
							selectedFacets[attribute].push(bucket_value + "");
						}
					}
				}
				break;
			case "slider":
				facetHtml += "";
				break;
			default:

		}
		return facetHtml;

	}

	_bindEvents() {
		$(".product-filters-title").unbind().bind('click', function() {
			$(this).toggleClass("open").next('.product-filters-list').toggleClass("open");
		});

		$("[data-facet-search]").unbind().bind('click', function(event) {
			event.preventDefault();
			console.log("facet click");
			const $inputCheckBox = $(this).find('input[type="checkbox"]');
			if ($inputCheckBox.length > 0 && $inputCheckBox.prop("checked") == true) {
				$inputCheckBox.prop("checked", false);

			} else {
				$inputCheckBox.prop("checked", true);

			}
			const facetAttribute = $(this).attr('data-facet-attribute');
			const facetValue = $(this).attr('data-facet-value');

			if (selectedFacets[facetAttribute]) {
				//exist facet
				let value_arr = selectedFacets[facetAttribute];
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
					delete selectedFacets[facetAttribute];
				}

			} else {
				// new facet
				selectedFacets[facetAttribute] = [facetValue];
			}

			let filterString = ""; //filtersBy={"category_id":%20"23|41|39|61"}

			$.each(selectedFacets, function(facet, values) {
				const valuesString = values.join("|");
				filterString += `,"${facet}":"${valuesString}"`;
			});

			if (filterString.trim() != "") {
				filterString = filterString.substring(1, filterString.length);
				filterString = "&filtersBy={" + filterString + "}";
			}

			let ajaxUrl2 = `${config.apiRootUrl}/search?store_hash=${config.storeHash}&keywords=${keywords}&is_facets=1&catalog_id=${gCatalogId}${filterString}`;
			console.log(ajaxUrl2);
			ajaxUrl2 = encodeURI(ajaxUrl2);
			console.log(ajaxUrl2);
			search(ajaxUrl2).then(res => {
				console.log(res);

				_initFacets(res);
				_initProducts(res);

			});

		});

	}

}