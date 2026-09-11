import os
from pathlib import Path
from bson import ObjectId
import gridfs
from backend.database import get_db, get_db_client, save_image_to_gridfs

db = get_db()
if db is None:
    print("Failed to get MongoDB db")
    exit(1)

fs = gridfs.GridFS(db)

# 1. Ensure sample images from test_images are in GridFS
test_images_dir = Path(r"c:\Users\SHUBHAM MISHRA\Downloads\VerifEye-main\VerifEye-main\test_images")
sample_files = {
    "test_label.jpeg": "image/jpeg",
    "test_image2.png": "image/png",
    "parle_g_gold_back.jpeg": "image/jpeg",
}

sample_file_ids = {}
for fname, mime in sample_files.items():
    fpath = test_images_dir / fname
    if fpath.exists():
        existing = db["fs.files"].find_one({"filename": fname})
        if existing:
            sample_file_ids[fname] = str(existing["_id"])
            print(f"Sample file '{fname}' already in GridFS: {existing['_id']}")
        else:
            with open(fpath, "rb") as f:
                data = f.read()
            fid = fs.put(data, filename=fname, content_type=mime)
            sample_file_ids[fname] = str(fid)
            print(f"Uploaded '{fname}' to GridFS: {fid}")

# 2. Build map of all filenames in GridFS
all_fs_files = {}
for f in db["fs.files"].find({}, {"filename": 1, "_id": 1}).sort("uploadDate", -1):
    fn = f.get("filename")
    if fn and fn not in all_fs_files:
        all_fs_files[fn] = str(f["_id"])

print(f"Total unique filenames in GridFS: {len(all_fs_files)}")

# 3. Seed file mappings for mock filenames
seed_mapping = {
    "haldiram_aloo_bhujia_150g.png": sample_file_ids.get("test_label.jpeg"),
    "haldirams_bhujia_sev_400g.png": sample_file_ids.get("test_label.jpeg"),
    "lays_cream_and_onion_green_chips_50g.png": sample_file_ids.get("test_image2.png"),
    "lays_indias_magic_masala_73g.png": sample_file_ids.get("test_image2.png"),
    "britannia_good_day_butter_cookies_100g.png": sample_file_ids.get("parle_g_gold_back.jpeg"),
    "amul_taaza_toned_milk_500ml.png": sample_file_ids.get("test_label.jpeg"),
}

default_fid = sample_file_ids.get("test_label.jpeg") or list(all_fs_files.values())[0]

# 4. Repair all inspection collections
collections_to_check = [c for c in db.list_collection_names() if not c.startswith("fs.") and c != "brand_repositories"]
print("Collections to repair:", collections_to_check)

updated_count = 0
for colname in collections_to_check:
    for doc in db[colname].find({}):
        iid = doc.get("inspection_id")
        fn = doc.get("filename")
        existing_urls = doc.get("image_urls")
        existing_fids = doc.get("image_file_ids")

        target_fid = None
        # Check if filename is directly in GridFS
        if fn and fn in all_fs_files:
            target_fid = all_fs_files[fn]
        elif fn and fn in seed_mapping:
            target_fid = seed_mapping[fn]
        elif not existing_fids:
            target_fid = default_fid

        needs_update = False
        update_set = {}
        if not existing_fids and target_fid:
            update_set["image_file_ids"] = [target_fid]
            needs_update = True
        
        if not existing_urls:
            fids = update_set.get("image_file_ids") or existing_fids or ([target_fid] if target_fid else [])
            if fids:
                update_set["image_urls"] = [f"/api/images/{fid}" for fid in fids]
                needs_update = True

        if needs_update:
            db[colname].update_one({"_id": doc["_id"]}, {"$set": update_set})
            updated_count += 1
            print(f"Updated {colname} -> {iid} ({fn}) with image: {update_set.get('image_urls')}")

print(f"Total documents updated: {updated_count}")
