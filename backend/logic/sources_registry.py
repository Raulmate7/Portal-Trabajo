"""Registro centralizado de fuentes de empleo y política sui generis / TDM (Directiva 96/9/CE y Art. 133 LPI)."""

SOURCES_REGISTRY: dict[str, dict[str, object]] = {
    "remotive": {
        "name": "Remotive Public API",
        "legal_basis": "public_api_with_attribution",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "remoteok": {
        "name": "RemoteOK JSON Feed",
        "legal_basis": "public_feed_with_attribution",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "himalayas": {
        "name": "Himalayas Remote Jobs API",
        "legal_basis": "public_api_with_attribution",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "workingnomads": {
        "name": "Working Nomads Public API",
        "legal_basis": "public_api_with_attribution",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "wwr": {
        "name": "We Work Remotely RSS",
        "legal_basis": "public_rss_with_attribution",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "pythonorg": {
        "name": "Python.org Jobs RSS",
        "legal_basis": "open_community_rss",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "jobfluent": {
        "name": "JobFluent Feed",
        "legal_basis": "attributed_metadata_only",
        "allow_full_description": False,
        "max_snippet_chars": 280,
        "require_rel_nofollow": True,
    },
    "tecnoempleo": {
        "name": "Tecnoempleo",
        "legal_basis": "attributed_metadata_only",
        "allow_full_description": False,
        "max_snippet_chars": 240,
        "require_rel_nofollow": True,
    },
    "infoempleo": {
        "name": "Infoempleo",
        "legal_basis": "attributed_metadata_only",
        "allow_full_description": False,
        "max_snippet_chars": 240,
        "require_rel_nofollow": True,
    },
}


def get_source_policy(source_key: str) -> dict[str, object]:
    return SOURCES_REGISTRY.get(
        (source_key or "").strip().lower(),
        {
            "name": source_key,
            "legal_basis": "attributed_metadata_only",
            "allow_full_description": False,
            "max_snippet_chars": 240,
            "require_rel_nofollow": True,
        },
    )
