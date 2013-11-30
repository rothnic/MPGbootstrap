/**
 * Created by nick on 11/30/13.
 */
// Source: http://stackoverflow.com/questions/8584098/how-to-change-an-element-type-using-jquery

(function($) {
    $.fn.changeElementType = function(newType) {
        var newElements = [];

        $(this).each(function() {
            var attrs = {};

            $.each(this.attributes, function(idx, attr) {
                attrs[attr.nodeName] = attr.nodeValue;
            });

            var newElement = $("<" + newType + "/>", attrs).append($(this).contents());

            $(this).replaceWith(newElement);

            newElements.push(newElement);
        });

        return $(newElements);
    };
})(jQuery);