import os
import re
import shutil
import tempfile
import logging
from typing import Optional
from git import Repo

logger = logging.getLogger(__name__)

class GitManifestService:
    """Service to automatically update image tags in GitOps Kubernetes Manifest Repository."""

    def __init__(
        self,
        repo_url: Optional[str] = None,
        token: Optional[str] = None,
        author_name: Optional[str] = None,
        author_email: Optional[str] = None,
    ):
        self.repo_url = repo_url or os.getenv("GIT_MANIFEST_REPO_URL", "")
        self.token = token or os.getenv("GIT_TOKEN", "")
        self.author_name = author_name or os.getenv("GIT_AUTHOR_NAME", "Control Plane Bot")
        self.author_email = author_email or os.getenv("GIT_AUTHOR_EMAIL", "bot@controlplane.local")

    def _get_authenticated_url(self) -> str:
        """Injects GitHub token into HTTPS repository URL for non-interactive push."""
        if not self.token or not self.repo_url:
            return self.repo_url
        if self.repo_url.startswith("https://"):
            return self.repo_url.replace("https://", f"https://x-access-token:{self.token}@")
        return self.repo_url

    async def update_manifest_image_tag(
        self,
        image_name: str,
        new_image_tag: str,
        commit_hash: str,
        target_manifest_path: str = "deployment.yaml"
    ) -> bool:
        """
        Clones manifest repo, updates container image tag in deployment YAML,
        commits changes, and pushes back to Git repository for ArgoCD sync.
        """
        if not self.repo_url:
            logger.error("GIT_MANIFEST_REPO_URL is not set. Skipping GitOps auto-commit.")
            return False

        auth_url = self._get_authenticated_url()
        temp_dir = tempfile.mkdtemp(prefix="gitops_manifest_")

        try:
            logger.info(f"Cloning GitOps manifest repo into {temp_dir}...")
            repo = Repo.clone_from(auth_url, temp_dir)

            # Configure git author
            with repo.config_writer() as git_config:
                git_config.set_value("user", "name", self.author_name)
                git_config.set_value("user", "email", self.author_email)

            # Search for deployment YAML file in cloned repo
            file_path = os.path.join(temp_dir, target_manifest_path)
            if not os.path.exists(file_path):
                # Search for any yaml file if specific target_manifest_path not found
                found_files = [
                    os.path.join(dp, f)
                    for dp, dn, filenames in os.walk(temp_dir)
                    for f in filenames if f.endswith((".yaml", ".yml")) and not f.startswith(".")
                ]
                if found_files:
                    file_path = found_files[0]
                else:
                    logger.error(f"No YAML manifest file found in repository {temp_dir}")
                    return False

            # Read existing YAML file
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Update image tag using regex pattern (e.g. image: repo/app:old_tag -> image: repo/app:new_tag)
            # Pattern matches 'image: <image_name>:<tag>' or 'image: <any_image>:<tag>'
            image_pattern = r"(image:\s*[\"']?)([^\s\"':]+)(:[^\s\"']*)?([\"']?)"
            updated_content = re.sub(
                image_pattern,
                rf"\g<1>{image_name}:{new_image_tag}\g<4>",
                content
            )

            if content == updated_content:
                logger.info("Image tag in manifest is already up to date. No changes made.")
                return True

            # Write updated manifest back
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(updated_content)

            # Git commit and push
            repo.git.add(A=True)
            commit_message = f"[GitOps Auto-Deploy] Update image tag to {new_image_tag} (commit: {commit_hash[:7]})"
            repo.index.commit(commit_message)

            origin = repo.remote(name="origin")
            origin.push()

            logger.info(f"Successfully pushed updated manifest image tag '{new_image_tag}' to {self.repo_url}")
            return True

        except Exception as e:
            logger.error(f"Failed to update and push GitOps manifest: {e}")
            return False
        finally:
            # Clean up temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
