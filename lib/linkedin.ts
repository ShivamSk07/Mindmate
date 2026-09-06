/**
 * LinkedIn API Integration Layer for Clarity CoWork
 * Supports OAuth 2.0 OpenID Connect, Profile Details, and Direct Post Publishing (REST & UGC APIs).
 */

export interface LinkedInProfile {
  sub: string;
  personUrn: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
}

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  details?: any;
}

/**
 * Fetch authenticated user's LinkedIn profile using OIDC userinfo endpoint
 */
export async function linkedin_get_profile(accessToken: string): Promise<LinkedInProfile | null> {
  try {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[LinkedIn API] Failed to fetch profile:", res.status, errBody);
      return null;
    }

    const data = await res.json();
    const personId = data.sub;
    const personUrn = personId.startsWith("urn:li:person:") ? personId : `urn:li:person:${personId}`;

    return {
      sub: personId,
      personUrn,
      name: data.name || `${data.given_name || ""} ${data.family_name || ""}`.trim() || "LinkedIn User",
      given_name: data.given_name,
      family_name: data.family_name,
      email: data.email,
      picture: data.picture,
    };
  } catch (error: any) {
    console.error("[LinkedIn API Error] linkedin_get_profile:", error);
    return null;
  }
}

/**
 * Publish a post to LinkedIn (personal profile)
 * Tries REST Posts API first, with fallback to UGC Posts API.
 */
export async function linkedin_create_post(
  accessToken: string,
  authorUrn: string,
  postText: string
): Promise<LinkedInPostResult> {
  const formattedUrn = authorUrn.startsWith("urn:li:person:") ? authorUrn : `urn:li:person:${authorUrn}`;
  const trimmedText = postText.trim();

  if (!trimmedText) {
    return { success: false, error: "Post commentary text cannot be empty." };
  }

  // 1. Try REST Posts API (Modern LinkedIn standard)
  try {
    const restPayload = {
      author: formattedUrn,
      commentary: trimmedText,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    const restRes = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(restPayload),
    });

    if (restRes.ok || restRes.status === 201) {
      const postIdHeader = restRes.headers.get("x-restli-id") || restRes.headers.get("x-linkedin-id");
      return {
        success: true,
        postId: postIdHeader || `li_post_${Date.now()}`,
        postUrl: "https://www.linkedin.com/feed/",
      };
    }
  } catch (err) {
    console.warn("[LinkedIn REST Posts API] Attempt failed, falling back to UGC API:", err);
  }

  // 2. Fallback: UGC Posts API
  try {
    const ugcPayload = {
      author: formattedUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: trimmedText,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const ugcRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ugcPayload),
    });

    if (ugcRes.ok || ugcRes.status === 201) {
      const ugcData = await ugcRes.json();
      return {
        success: true,
        postId: ugcData.id || `urn:li:share:${Date.now()}`,
        postUrl: "https://www.linkedin.com/feed/",
        details: ugcData,
      };
    }

    const errText = await ugcRes.text();
    console.error("[LinkedIn UGC API Error]", ugcRes.status, errText);
    return {
      success: false,
      error: `LinkedIn API error (${ugcRes.status}): ${errText}`,
    };
  } catch (error: any) {
    console.error("[LinkedIn API Create Post Error]", error);
    return {
      success: false,
      error: error.message || "Failed to publish post to LinkedIn",
    };
  }
}
