import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("plugin.serialization")
    kotlin("plugin.compose")
}

android {
    namespace = "com.mementolife.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.mementolife.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }

    sourceSets {
        getByName("main") {
            kotlin.srcDirs("src/main/kotlin")
        }
        getByName("test") {
            kotlin.srcDirs("src/test/kotlin")
            // Los unit tests leen el dataset y los tokens directo de la fuente
            // de verdad (render-core/, content/efemerides/), sin copias.
            // Rutas relativas al projectDir del módulo (android/app/).
            resources.srcDirs("../../render-core", "../../content/efemerides")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.datastore:datastore-preferences:1.2.1")
    implementation("androidx.work:work-runtime-ktx:2.11.2")

    // UI (F2): Compose. El selector de idioma es propio (ui/strings/UiStrings.kt),
    // no depende de AppCompatDelegate/localeConfig — ver esa clase para el porqué.
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    debugImplementation("androidx.compose.ui:ui-tooling")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.16.1")
    testImplementation("androidx.work:work-testing:2.11.2")
}

// El diseño y el dataset viven en render-core/ y content/, fuera de android/,
// para que no exista una segunda copia de la verdad. Esta tarea los sincroniza
// a assets/ en cada build; el contenido copiado no se versiona (ver .gitignore).
val copyDesignAndContentAssets by tasks.registering(Copy::class) {
    from(rootProject.projectDir.resolve("../render-core/design-tokens.json")) {
        into("render-core")
    }
    from(rootProject.projectDir.resolve("../content/efemerides")) {
        include("es.json", "en.json")
        into("efemerides")
    }
    into(layout.projectDirectory.dir("src/main/assets"))
}

tasks.named("preBuild") {
    dependsOn(copyDesignAndContentAssets)
}
