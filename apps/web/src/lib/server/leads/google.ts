type GooglePlaceDetailsResult = {
  name: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  id: string;
  googleMapsUri?: string;
  businessStatus?: string;
};

export const googleTextSearch = async (apiKey: string, query: string) => {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.types",
          "places.rating",
          "places.userRatingCount",
          "places.internationalPhoneNumber",
          "places.nationalPhoneNumber",
          "places.websiteUri",
        ].join(","),
      },
      body: JSON.stringify({ textQuery: query }),
    }
  );
  if (!response.ok) {
    console.table(await response.json());

    throw new Error(`Google Places request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    places?: Array<{
      id?: string;
      name?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      types?: string[];
      rating?: number;
      userRatingCount?: number;
      websiteUri?: string;
    }>;
  };

  return (data?.places ?? []).map((place) => ({
    name: place.displayName?.text ?? "",
    place_id: place.id ?? place.name?.split("/").pop() ?? "",
    formatted_address: place.formattedAddress,
    types: place.types,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    website: place.websiteUri,
  }));
};

export const googlePlaceDetails = async (
  apiKey: string,
  placeId: string
) => {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=${[
      "id",
      "displayName",
      "formattedAddress",
      "types",
      "rating",
      "userRatingCount",
      "websiteUri",
      "nationalPhoneNumber",
      "internationalPhoneNumber",
      "googleMapsUri",
      "businessStatus",
    ].join(",")}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GooglePlaceDetailsResult | null;
};
