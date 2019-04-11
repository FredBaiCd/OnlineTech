import $ from 'jquery';
import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';
import ProductDetails from '../common/product-details';
import { defaultModal } from './modal';
import 'slick-carousel';

export default function (context) {
    const modal = defaultModal();

    $('body').on('click', '.quickview', event => {
        event.preventDefault();

        const productId = $(event.currentTarget).data('productId');

        modal.open({ size: 'large' });

        utils.api.product.getById(productId, { template: 'products/quick-view' }, (err, response) => {
            modal.updateContent(response);

            modal.$content.find('.productView').addClass('productView--quickView');

            modal.$content.find('[data-slick]').slick();

            // for bundleb2b
            handleRoleId();
            return new ProductDetails(modal.$content.find('.quickView'), context);

        });

        // for bundleb2b
        const handleRoleId = function() {
            if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
                const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
                if (bundleb2b_user.role_id == "0") {
                    $("#form-action-addToCart").hide();
                    console.log("Junior User");
                } else if (bundleb2b_user.role_id == "1" || bundleb2b_user.role_id == "2") {
                    console.log("Admin User");
                }
            }
        }
    });

    // for bundleb2b
    const handleRoleId = function() {
        if (sessionStorage.getItem("bundleb2b_user") && sessionStorage.getItem("bundleb2b_user") != "none") {
            const bundleb2b_user = JSON.parse(sessionStorage.getItem("bundleb2b_user"));
            if (bundleb2b_user.role_id == "0") {
                $("#form-action-addToCart").hide();
                console.log("Junior User");
            } else if (bundleb2b_user.role_id == "1" || bundleb2b_user.role_id == "2") {
                console.log("Admin User");
            }
        }
    }
}
