"""
One-time seed script to populate the assets_db DynamoDB table.
Run with: python seed_assets.py
"""

import re

import boto3


TABLE_NAME = "assets_db"

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def slugify(text):
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug


FILM_ASSETS = [
    {
        "title": "A STUDY ON THE MONSTROUS FEMININE",
        "subtitle": "(experimental short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/MonFem.mp4",
        "order": 1,
    },
    {
        "title": "Rumble",
        "subtitle": "(narrative short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Rumble5.mp4",
        "order": 2,
    },
    {
        "title": "Candle Stick",
        "subtitle": "(comedy short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/CANDLESTICK.mp4",
        "order": 3,
    },
    {
        "title": "Josh",
        "subtitle": "(mock ad)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Josh2.mp4",
        "link": "https://www.instagram.com/reel/DA3uj79PNei",
        "order": 4,
    },
    {
        "title": "The Savant",
        "subtitle": "(music video)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Savant.mp4",
        "link": "https://youtu.be/HtqLydTvjqk",
        "order": 5,
    },
    {
        "title": "Aloe Vera",
        "subtitle": "(music video)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/ALOE+VERA.mp4",
        "link": "https://www.youtube.com/watch?v=CBHR49D7qzM",
        "order": 6,
    },
    {
        "title": "Sketchy Characters",
        "subtitle": "(comedy short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Sketchy.mp4",
        "laurels": True,
        "order": 7,
    },
    {
        "title": "WHOOP",
        "subtitle": "(mock ad)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/WHOOP.mp4",
        "order": 8,
    },
    {
        "title": "White Snake",
        "subtitle": "(experimental short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/WhiteSnake.mp4",
        "order": 9,
    },
    {
        "title": "Adrenaline Rush",
        "subtitle": "(virtual production short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/AdrenalineRush.mp4",
        "order": 10,
    },
    {
        "title": "Echos of Eden",
        "subtitle": "(creative & technical analysis)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/EchosOfEden.mp4",
        "link": "https://youtu.be/uz1GZ5O2K6g",
        "order": 11,
    },
    {
        "title": "Frontside Boardslide",
        "subtitle": "(documentary short film)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/FSBS.mp4",
        "order": 12,
    },
    {
        "title": "Senior Thesis",
        "subtitle": "(cinematography capstone presentation)",
        "src": "https://d3amd0zp63qrni.cloudfront.net/assets/videos/teaser.mp4",
        "link": "https://www.youtube.com/watch?v=_y2nxgTp7NU",
        "order": 13,
    },
]

CREATIVE_DIRECTION = "Creative Direction"
CLIENT_WORK = "Client Work"
ADVENTURES = "Adventures"

COLLECTION_ORDER = {
    CREATIVE_DIRECTION: 1,
    CLIENT_WORK: 2,
    ADVENTURES: 3,
}

PHOTO_ASSETS = [
    {
        "folder": "CGI Collab Composite",
        "collection": CREATIVE_DIRECTION,
        "order": 1,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/under-ice.JPEG",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/kitties-22.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/kitties-60.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/GoodOmen.jpg",
        ],
    },
    {
        "folder": "Burberry Mock F/W Campaign",
        "collection": CREATIVE_DIRECTION,
        "order": 2,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/1st.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/2nd.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/3rd.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/4th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/5th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/6th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/7th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/8th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/9th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/10th.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/recreation.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/recreation-1.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/Lucy_RecreationAssignment_02.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/Lucy_RecreationAssignment_01.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/Lucy_RecreationAssignment_0.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/Lucy_AbstractAssignment_02.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/Lucy_AbstractAssignment_02-8.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/burberry/last.jpg",
        ],
    },
    {
        "folder": "R13 Styling Catalogue",
        "collection": CREATIVE_DIRECTION,
        "order": 3,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/lights_off_3_4.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/stop1_full_body.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/highkey_1_3.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/highkey_full_length.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/lights_off_full_body.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/stop1_1_3.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/color_1_3.jpg",
        ],
    },
    {
        "folder": "Future of Fashion",
        "collection": CREATIVE_DIRECTION,
        "order": 4,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/Lucy_Future_Fashion_CU.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1-4.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1-11.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1-7.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/LUCY_Future_Fashion_1-edit.jpg",
        ],
    },
    {
        "folder": "Pajama Day",
        "collection": CREATIVE_DIRECTION,
        "order": 5,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-142.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-239.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-401.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-411.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-58.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-89.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-95.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-98.jpg",
        ],
    },
    {
        "folder": "FST Lookbook",
        "collection": CREATIVE_DIRECTION,
        "order": 6,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0292.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0319.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0397.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0584.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/maggiesdigicam-27.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0586-2.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0596.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0681-2.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0693.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/maggiesdigicam-66.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0698-2.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0753-2.jpg",
        ],
    },
    {
        "folder": "The Patrol",
        "collection": CREATIVE_DIRECTION,
        "order": 7,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/Bike_Edit.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/IMG_6923.PNG",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2018.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1975.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/cu-site-side.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2055.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1041.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2059.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1012.png",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2010.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1992.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1943.jpg",
        ],
    },
    {
        "folder": "Headshots",
        "collection": CLIENT_WORK,
        "order": 1,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-129.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-132.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-37.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-65.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/isabella.JPG",
        ],
    },
    {
        "folder": "Portraits",
        "collection": CLIENT_WORK,
        "order": 2,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/_DSC3219.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/_DSC3255.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/_DSC3346.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/_DSC3377.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/_DSC3462.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/_DSC3594.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/caroline-1.JPG",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/caroline-2.JPG",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/caroline-3.JPG",
        ],
    },
    {
        "folder": "Grad Photos",
        "collection": CLIENT_WORK,
        "order": 3,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-160.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-138.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-154.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-203.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-53.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-56.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-60.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-88.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/devgradpic-22.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/devgradpic-33.jpg",
        ],
    },
    {
        "folder": "Caffeine and Octane",
        "collection": CREATIVE_DIRECTION,
        "order": 8,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820023.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820024.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820025.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820026.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820027.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820028.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820029.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820030.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/caffeine-and-octane/000027820031.jpg",
        ],
    },
    {
        "folder": "Stickered",
        "collection": CREATIVE_DIRECTION,
        "order": 9,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/stickered/1-stick--.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/stickered/-2-stick-.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/stickered/3-stick.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/stickered/4-stick.jpg",
        ],
    },
    {
        "folder": "Costa Rica",
        "collection": ADVENTURES,
        "order": 1,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/costa-rica/01.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/costa-rica/_DSC0401.jpg",
        ],
    },
    {
        "folder": "Aurora Borealis",
        "collection": ADVENTURES,
        "order": 2,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/costa-rica/reflection1.jpg",
        ],
    },
    {
        "folder": "Concerts",
        "collection": ADVENTURES,
        "order": 3,
        "photos": [
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/concerts/1-green-day.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/concerts/2-greenday.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/concerts/3-green-day.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/concerts/3-greenday.jpg",
            "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/concerts/5-greeday.jpg",
        ],
    },
]


def seed():
    items = []

    for film in FILM_ASSETS:
        item = {
            "Type": "film",
            "AssetID": slugify(film["title"]),
            "title": film["title"],
            "subtitle": film["subtitle"],
            "src": film["src"],
            "order": film["order"],
        }

        if "link" in film:
            item["link"] = film["link"]

        if film.get("laurels"):
            item["laurels"] = True

        items.append(item)

    for collection_name, order in COLLECTION_ORDER.items():
        items.append({
            "Type": "photo_collection",
            "AssetID": collection_name,
            "title": collection_name,
            "order": order,
        })

    for group in PHOTO_ASSETS:
        folder_slug = slugify(group["folder"])

        items.append({
            "Type": "photo_folder",
            "AssetID": folder_slug,
            "title": group["folder"],
            "collection": group["collection"],
            "order": group["order"],
        })

        for i, src in enumerate(group["photos"], 1):
            items.append({
                "Type": "photo",
                "AssetID": f"{folder_slug}-{i:02d}",
                "folder": folder_slug,
                "src": src,
                "order": i,
            })

    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

    print(f"Seeded {len(items)} items into {TABLE_NAME}")


if __name__ == "__main__":
    seed()
