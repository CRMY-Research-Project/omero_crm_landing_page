#!/usr/bin/env python
#
# Copyright (c) 2024 vernonlim.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.template import loader
from django.templatetags import static

from omeroweb.webclient.decorators import login_required

# Image names carrying no research value, mirrored from the previous
# client-side filter (label/macro slides clutter the listing).
EXCLUDED_NAME_PARTS = ("label", "macro")


@login_required()
def search(request, conn=None, **kwargs):
    """Server-side image search across ALL projects/datasets (TC-05).

    Replaces the old client-side approach where the browser fetched every
    project, dataset and image up front (an N+1 request waterfall that
    cannot scale to the full corpus). Traversal here runs on OMERO's
    Python API inside the server network, and only one page of results
    crosses the wire.

    GET params: q (substring, case-insensitive, matches image or dataset
    name), page (1-based), page_size (max 100).
    """
    query = request.GET.get("q", "").strip().lower()
    try:
        page = max(1, int(request.GET.get("page", "1")))
        page_size = min(100, max(1, int(request.GET.get("page_size", "5"))))
    except ValueError:
        return JsonResponse(
            {"success": False,
             "error": {"code": "bad_params",
                       "message": "page and page_size must be integers"}},
            status=400)

    projects = []
    matches = []
    dataset_count = 0
    for project in conn.getObjects("Project"):
        description = project.getDescription() or "N/A"
        projects.append({
            "id": project.getId(),
            "name": project.getName(),
            "description": description,
        })
        for dataset in project.listChildren():
            dataset_count += 1
            dataset_name = dataset.getName() or ""
            for image in dataset.listChildren():
                name = image.getName() or "Unnamed Image"
                lower = name.lower()
                if any(part in lower for part in EXCLUDED_NAME_PARTS):
                    continue
                if query and query not in lower \
                        and query not in dataset_name.lower():
                    continue
                matches.append({
                    "id": image.getId(),
                    "name": name,
                    "dataset_id": dataset.getId(),
                    "dataset_name": dataset_name,
                    "project_id": project.getId(),
                    "project_description": description,
                })

    matches.sort(key=lambda m: (m["dataset_name"].lower(),
                                m["name"].lower()))
    start = (page - 1) * page_size
    return JsonResponse({
        "success": True,
        "total": len(matches),
        "page": page,
        "page_size": page_size,
        "dataset_count": dataset_count,
        "projects": projects,
        "items": matches[start:start + page_size],
    })


def _is_public_user(request, conn, username):
    """True when the current session is OMERO's anonymous public user.

    The landing page's URL matches ``omero.web.public.url_filter`` in
    docker-compose, so OMERO auto-authenticates guests as the configured
    public user and ``@login_required`` succeeds for them too. To tell a
    real researcher apart from a browsing guest we check the session
    connector's ``is_public`` flag first, then fall back to comparing the
    username against the configured ``PUBLIC_USER``.
    """
    try:
        connector = request.session.get("connector")
        if connector is not None and getattr(connector, "is_public", False):
            return True
    except Exception:  # pragma: no cover - defensive against session shape
        pass
    try:
        public_user = getattr(settings, "PUBLIC_USER", None)
        if public_user and username == public_user:
            return True
    except Exception:  # pragma: no cover
        pass
    return False


@login_required()
def portal_summary(request, conn=None, **kwargs):
    """Identity + owned-data summary for the researcher dashboard.

    Same-origin GET/JSON consumed by the Svelte shell + "My Portal" view.
    Distinguishes a real login from the public/guest browsing session so
    the shell can show a username + logout vs. a "Log in" affordance
    without a second request. Owned project/dataset counts are best-effort
    (skipped for the public user) and never fail the identity signal.
    """
    user = conn.getUser()
    username = user.getName() or ""
    is_public = _is_public_user(request, conn, username)

    try:
        full_name = user.getFullName() or username
    except Exception:  # pragma: no cover - gateway shape defensive
        full_name = username

    try:
        is_admin = conn.isAdmin()
    except Exception:  # pragma: no cover
        is_admin = False

    counts = None
    if not is_public:
        try:
            uid = conn.getUserId()
            counts = {
                "projects": sum(
                    1 for _ in conn.getObjects("Project", opts={"owner": uid})),
                "datasets": sum(
                    1 for _ in conn.getObjects("Dataset", opts={"owner": uid})),
            }
        except Exception:  # pragma: no cover - opts unsupported / heavy tree
            counts = None

    payload = {
        "success": True,
        "authenticated": not is_public,
        "is_public": is_public,
        "username": username,
        "full_name": full_name,
        "is_admin": is_admin,
        # Return to the portal after logging in; logout drops the session.
        "login_url": "/webclient/login/?url=/omero_crm_landing_page/",
        "logout_url": "/webclient/logout/",
    }
    if counts is not None:
        payload["counts"] = counts
    return JsonResponse(payload)


@login_required()
def index(request, conn=None, **kwargs):
    """
    Svelte App Home Page
    """
    # We need to serve the create-react-app build.
    # Load the template html and replace OMEROWEB_INDEX
    template = loader.get_template('index.html')
    html = template.render({}, request)

    # update links to static files
    static_dir = static.static('/')
    html = html.replace('href="/static/', 'href="%s' % static_dir)
    html = html.replace('src="/static/', 'src="%s' % static_dir)
    return HttpResponse(html)
