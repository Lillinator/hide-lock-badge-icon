export default function migrate(settings) {
  if (settings.has("categories_and_channels")) {
    // Update the setting to remove the slug
    //   from: "slug;3|slug/subslug;4|slug;5"
    //   to: "3|4|5"
    settings.set(
      "categories_and_channels",
      settings
        .get("categories_and_channels")
        .split("|")
        .map((category) => category.split(";")[1])
        .join("|")
    );
  }

  return settings;
}
