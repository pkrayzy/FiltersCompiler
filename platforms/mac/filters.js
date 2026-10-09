{
	"groups": [
		{
			"groupId": 1,
			"groupName": "Ad blocking",
			"displayNumber": 1
		},
		{
			"groupId": 2,
			"groupName": "Privacy",
			"displayNumber": 2
		},
		{
			"groupId": 3,
			"groupName": "Social widgets",
			"displayNumber": 3
		},
		{
			"groupId": 4,
			"groupName": "Annoyances",
			"displayNumber": 4
		},
		{
			"groupId": 5,
			"groupName": "Security",
			"displayNumber": 5
		},
		{
			"groupId": 6,
			"groupName": "Other",
			"displayNumber": 6
		},
		{
			"groupId": 7,
			"groupName": "Language-specific",
			"displayNumber": 7
		}
	],
	"filters": [
		{
			"filterId": 12,
			"name": "(Obsolete) AdGuard Safari filter",
			"description": "Special filter for Safari 9+ on iOS and Mac OS. We need a separate filter for Safari browser because it does not fully support our rules syntax. Already included in AdGuard Base filter.",
			"homepage": "https://github.com/AdguardTeam/AdguardFilters/blob/master/SafariFilter/sections/README.md",
			"expires": 432000,
			"displayNumber": 2,
			"groupId": 6,
			"subscriptionUrl": "https://filters.adtidy.org/mac/filters/12.txt",
			"platformsExcluded": [
				"ext_chromium_mv3",
				"ext_edge_mv3",
				"ext_opera_mv3"
			],
			"version": "1.0.0.32",
			"timeUpdated": "2026-10-03T22:17:39+0000",
			"languages": []
		},
		{
			"filterId": 15,
			"name": "AdGuard DNS filter",
			"description": "Filter composed of several other filters (AdGuard Base filter, Social Media filter, Tracking Protection filter, Mobile Ads filter, EasyList and EasyPrivacy) and simplified specifically to be better compatible with DNS-level ad blocking.",
			"homepage": "https://adguard.com/kb/general/ad-filtering/adguard-filters/",
			"expires": 432000,
			"displayNumber": 3,
			"groupId": 6,
			"subscriptionUrl": "https://filters.adtidy.org/mac/filters/15.txt",
			"platformsExcluded": [
				"ext_chromium_mv3",
				"ext_edge_mv3",
				"ext_opera_mv3"
			],
			"version": "2.1.37.54",
			"timeUpdated": "2026-10-09T00:20:18+0000",
			"languages": []
		}
	]
}