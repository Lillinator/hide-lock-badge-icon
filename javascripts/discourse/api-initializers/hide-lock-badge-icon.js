import { apiInitializer } from "discourse/lib/api";
import DiscourseURL from "discourse/lib/url";
import Category from "discourse/models/category";

export default apiInitializer("1.15.0", (api) => {
  if (!settings.categories_and_channels) {
    return;
  }

  const siteSettings = api.container.lookup("service:site-settings");

  const categoriesIds = settings.categories_and_channels.split("|").map(Number);
  const categoriesIdsWithSlug = Category.findByIds(categoriesIds).map(
    (category) => {
      return {
        id: category.id,
        slug: category.slug,
      };
    }
  );

  const categoriesSlugs = categoriesIdsWithSlug.map(
    (category) => category.slug
  );

  // Insert data-category-id attribute to category links for easier styling.
  // Usage restricted to the sidebars and chat.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.tagName === "A" &&
          DiscourseURL.isInternal(node.href) &&
          node.dataset.categoryId === undefined &&
          node.firstChild?.dataset === undefined &&
          node.href.includes("/c/") &&
          categoriesSlugs.some((slug) => node.href.includes(`/${slug}/`))
        ) {
          // Extract slug path: category/subcategory
          const parts = node.href.split("/");
          const start = parts.indexOf("c");
          const categorySlug = parts[start + 1];
          const subcategorySlug = !/\d/.test(parts[start + 2])
            ? parts[start + 2]
            : "";

          const category = categoriesIdsWithSlug.findBy(
            "slug",
            subcategorySlug || categorySlug
          );

          if (category) {
            node.dataset.categoryId = category.id;

            // Specific fix for chat in full screen.
            if (siteSettings.chat_enabled) {
              const element = node
                .closest(".chat-channel-header-details")
                ?.querySelector(".chat-channel-title.is-category");

              if (element) {
                element.dataset.categoryId = category.id;
              }
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributeFilter: ["href"],
  });
});
